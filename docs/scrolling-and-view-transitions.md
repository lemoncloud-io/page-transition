# Scrolling & View Transitions (the iOS WebKit caveat)

A note on how this library interacts with page scroll, a WebKit bug it
exposes, the pattern that works around it today, and what a library-level
fix would look like.

## TL;DR

- The View Transitions API snapshots the **document root**. On iOS Safari /
  WKWebView, when the **document itself is scrolled**, the
  `::view-transition-old(root)` snapshot is captured from the document's
  scroll **origin (top)** — so the page you are leaving flashes at
  scroll-top 0 for one frame, on both forward and back navigation. This is
  independent of the animation (slide, fade, …); it is the snapshot
  geometry, not the keyframes.
- The library cannot fix this alone, because *whether the document
  scrolls* is the host app's layout decision. The robust fix is to make
  the **document never scroll** and delegate scrolling to a single
  container element.
- The library no longer hard-codes `window.scroll*`: pass
  [`scrollRoot`](#using-scrollroot) and it targets the container for you.
  **Forward** reset-to-top has worked since 1.3.0; **back** restoration
  only since **1.4.0**, and only lands on the destination page since
  **1.4.1** — see [Back restoration by version](#back-restoration-by-version).
  Apps on 1.4.1 can drop their hand-rolled version.
- A separate, app-side trap: setting `history.scrollRestoration = 'manual'`
  turns the **native swipe-back** gesture of a WKWebView into a white
  screen whenever the two pages are scrolled differently. The library never
  touches that setting; leave it on `'auto'` — see
  [Native swipe-back and `history.scrollRestoration`](#native-swipe-back-and-historyscrollrestoration).

## Why it happens

`executePageTransition` (in `packages/core/src/transition.ts`) drives the
scroll alongside the transition:

```ts
const isBack = options?.direction === 'back';
const delta = options?.delta ?? (isBack ? -1 : 0);
const scrollRoot = resolveScrollRoot(options);
const savedScrollKey = isBack ? undefined : saveScrollPosition(scrollRoot);
...
viewTransition = startViewTransition(async () => {
  await runNavigation(navigationFn);
  if (isBack) handleBackScroll(scrollRoot, delta);
  else        applyScrollPosition({ x: 0, y: 0 }, scrollRoot);
});
```

`readScrollPosition` / `applyScrollPosition` (in `scroll.ts`) target
`scrollRoot` when one is given — `scrollTop`/`scrollLeft` and
`el.scrollTo` — and fall back to `window.scrollX/Y` and `window.scrollTo`
when it is not. The window fallback is correct when the **document** is
the scroller, which is the default for most pages, and is the case this
section is about.

The problem is on WebKit specifically: the root snapshot for a scrolled
document is taken from the document top, not from the current scroll
offset. So even though the library recorded the right number, the
*captured image* of the outgoing page shows its top. Chromium clips the
root snapshot to the visible viewport, so it does not reproduce; WebKit
(iOS Safari, all WKWebViews) does.

Plain navigation (no `startViewTransition`) is unaffected because it takes
no snapshot.

## The pattern that works (host app)

Stop scrolling the document; scroll a single container instead. With the
document pinned at scroll-top 0, the root snapshot always matches what is
on screen.

```css
html,
body {
  height: 100%;
}
body {
  overflow: hidden; /* document never scrolls */
}
.app-scroll {
  height: 100dvh;
  overflow-y: auto;
  overscroll-behavior-y: contain;
}
```

```tsx
// One scroll container wraps the routed content. Fixed chrome (headers
// you keep pinned, toasts) stays outside it, viewport-relative.
<div className="app-scroll">
  <Routes />
</div>
```

Pass that container to the library as `scrollRoot` and it owns scroll
save/restore on the container instead of the window — see
[Using `scrollRoot`](#using-scrollroot).

The cost of pinning: iOS's **status-bar tap → scroll to top** acts on the
WKWebView's own scroll view, and with the document pinned there is nothing
for it to move. `muzly-app` adopted the container pattern and then reverted
to a scrolling document for exactly this reason (commit `8c713f3` in that
repo). Weigh a one-frame snapshot flash against losing tap-to-top before
you pin.

One thing stays the app's job: repoint everything else that read the
document scroll — `IntersectionObserver` roots, pull-to-refresh, "header
shadow on scroll" listeners — at the container.

`epyt-app`'s web client (`apps/web`) still carries a hand-rolled
`useScrollRestoration`; it predates `scrollRoot` and is no longer the
pattern to copy.

> Important: do **not** put `transform` / `filter` / `will-change` on the
> scroll container — they make `position: fixed` descendants resolve
> against the container instead of the viewport.

## Can the library solve it itself?

**Not fully — and not alone.** The snapshot-from-top behavior is WebKit
reading the *document* scroll position, and whether the document scrolls
is determined by the host app's CSS/layout (`body { overflow }`, page
heights). The library cannot impose that the document stay unscrolled, and
faking it (e.g. resetting document scroll + translating content during the
transition) is fragile and would fight the app's own layout.

**What the library *does* do** is stop assuming the document is the
scroller, so apps that adopt the container pattern don't have to disable
the library's scroll handling and reimplement restoration. See below.

## Using `scrollRoot`

`TransitionOptions.scrollRoot` (surfaced through both the React and Vue
wrappers) names the element that owns the scroll position for a
navigation. When set, save and restore target that element
(`scrollTop`/`scrollLeft`, `el.scrollTo`) instead of the window.

```tsx
const scroller = useRef<HTMLDivElement>(null);
const navigate = useNavigateWithTransition();

// Getter form — resolved when the transition runs, so the element may
// mount after the hook is created.
navigate('/detail', { scrollRoot: () => scroller.current });
```

```vue
<script setup>
const scroller = ref(null);
const { navigate, goBack } = useNavigateWithTransition();

navigate('/detail', { scrollRoot: () => scroller.value });
goBack({ scrollRoot: () => scroller.value });
</script>
```

What it covers:

- **Forward** — the new page opens at the top of the container
  (`window.scrollTo` is a no-op on a pinned document, which is why an app
  without `scrollRoot` sees the new page open at the previous page's
  offset).
- **Back** (1.4.1+) — the destination entry's saved offset is applied
  inside the transition callback, after the destination page has
  committed and before the new snapshot is captured, so there is no
  visible jump. Earlier versions differ — see below.

The default (window) behavior is unchanged; `scrollRoot` is opt-in.

### Back restoration by version

`history.go(-1)` only queues the traversal: `popstate` reaches the router
in a later task, so at the moment the View Transitions callback starts,
`history.state` and the DOM still describe the page being *left*.

| Version | What back restoration did |
|---|---|
| 1.3.0 | Looked the destination up by `history.state.key` — the key of the page being left. Never matched; silently restored nothing. |
| 1.4.0 | Found the destination by **ordinal** (`history.state.idx` for react-router, `history.state.position` for vue-router) offset by the hop count, so the lookup works while the traversal is still unsettled. But the callback still ended after one microtask, so the offset was applied to the *leaving* page's DOM and the "new" snapshot was taken of that page. |
| 1.4.1 | The React and Vue wrappers hold the callback open until the router has committed the destination (`location.key` layout-effect cleanup in React, `afterEach` + `nextTick` in Vue), with a 500ms fallback for hops that never navigate. Core names the destination entry *before* the navigation runs, so it reads the right record whether the traversal has settled or not. |

Routers that expose no ordinal, and hand-rolled `history.pushState`
navigation, get forward reset-to-top but no back restoration — see
`TransitionOptions.delta` for the hop count the library uses.

Three consequences of waiting for the commit, all accepted:

- A numeric hop that cannot change the location (`navigate(0)`, a hop
  past either end of the stack, a navigation a guard blocks) resolves
  after the 500ms fallback rather than immediately. The library cannot
  tell "not yet" from "never" without it.
- The React hook subscribes to `useLocation()`, so a component that calls
  `useNavigateWithTransition` or `useGoBack` re-renders on every
  navigation.
- The wait is part of the navigation callback, so the `animation: 'none'`,
  unsupported-browser and reduced-motion paths wait too. Only the branches
  that skip `executePageTransition` altogether return as soon as the
  router call does: `transition: false` (or `replace: true` without
  `transition: true`) in both wrappers, and an unsupported browser in the
  Vue composable.

This does **not** by itself remove the WebKit flash: the app must still
pin the document so the root snapshot is captured at top == on-screen.
The option removes the need to fight the library while doing so.

## Native swipe-back and `history.scrollRestoration`

This one is not the library's, but it produced the same report — "back
shows a white screen unless both pages are at the top" — from three apps
that use the library. It is confirmed on-device in one (`muzly-app`);
the other two are suspected, not verified.

**Symptom.** `allowsBackForwardNavigationGestures` on the WKWebView. The
header back button (`goBack()`) works. The edge-swipe gesture reveals the
previous page only when both pages are scrolled to the top; otherwise it
reveals a blank white (or background-coloured) sheet, and the real page
appears only after the gesture completes.

**Cause.** The gesture does not render the previous page; it drags a
snapshot WebKit took when you left it. Before using that snapshot WebKit
checks it against the target history item, in
`Source/WebKit/UIProcess/ios/ViewGestureControllerIOS.mm`
(`beginSwipeGesture`, the `canUseSnapshot` lambda):

```cpp
if (!shouldRestoreScrollPosition && (currentScrollPosition != snapshot->viewScrollPosition()))
    return false;
```

`shouldRestoreScrollPosition` is the item's flag behind
`history.scrollRestoration` — `History::setScrollRestoration` in
`Source/WebCore/page/History.cpp` stores `'auto'` as `true` and
`'manual'` as `false`. So with `'manual'`, a snapshot is rejected whenever
the page you are on is scrolled differently from the page you are going
back to, and the swipe shows `[UIColor whiteColor]` (or the snapshot's
recorded background colour) instead. Read on WebKit `main` on 2026-09-21;
the exact revision shipping in a given iOS is not pinned, but the
behaviour matched on-device.

**Fix (app-side).** Do not set `history.scrollRestoration = 'manual'`
inside a WKWebView. The library never sets it either way. An app that
restores scroll itself (a layout effect keyed by the location) coexists
with `'auto'`: both write the same value, in the same frame. Verified on
an iOS device in `muzly-app` on 2026-09-21; not yet on Android.

**Known limit.** Once the gesture completes, WebKit swaps the snapshot for
the live page and there is a visible flash — at scroll top too, and with
the app's own restoration disabled too, so it is not a scroll race. It is
the snapshot → live handoff, and `epyt-app`'s note records it as only
partially reducible (keep the shell mounted, restore in a layout effect).
The gesture was kept anyway; an interactive swipe that follows the finger
was judged worth the flash.

## Checklist for consumers on iOS WebViews

1. Pin the document: `body { overflow: hidden }`, scroll a `100dvh`
   container.
2. Save/restore the **container** `scrollTop` (layout effect + a synchronous
   commit such as `legacyFlushSync`).
3. Repoint `IntersectionObserver` roots and any `window` scroll listeners
   at the container.
4. No `transform`/`filter` on the scroll container (keeps `fixed` chrome
   viewport-relative).
5. Reserve async content height (e.g. image `aspect-ratio`) so restore
   doesn't clamp to 0 on a not-yet-laid-out page.
6. Keep the shell route **mounted** across navigations.
7. Leave `history.scrollRestoration` on `'auto'` if the native swipe-back
   gesture is enabled.

## The other WKWebView flash: unmounting a large subtree

The scroll flash above is one cause. There is a second, with a different
mechanism: if a route change **unmounts a large subtree** — a full-screen
route declared as a *sibling* of the tab-shell route rather than a child
of it — the snapshot is captured against a half-torn-down tree.

The fix is structural and entirely app-side: keep the shell route mounted
and let only the `<Outlet>` content swap, hiding chrome with CSS instead
of unmounting it. Verified in `muzly-app` by asserting the shell element
is the same DOM node across the navigation.

```tsx
// Sibling — the shell unmounts on entering /player.
<Route path="/" element={<TabLayout />}>...</Route>
<Route path="/player" element={<Player />} />

// Child — the shell stays mounted, only the Outlet swaps.
<Route path="/" element={<TabLayout />}>
  ...
  <Route path="player" element={<Player />} />
</Route>
```

This does not promise a complete fix: `epyt-app`'s own note records the
flicker as only *partially* solved by the structural change, with the
WKWebView snapshot limit remaining. It is invisible outside a real device,
so it is worth doing before you can measure it.
