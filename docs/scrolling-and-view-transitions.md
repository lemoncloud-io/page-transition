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
- Today the library hard-codes `window.scroll*` for its scroll
  save/restore, so an app that adopts a scroll container has to disable
  that and reimplement restoration itself. A `scrollRoot` option (see
  [Proposed library fix](#proposed-library-fix)) would let the library do
  it for them.

## Why it happens

`executePageTransition` (in `packages/core/src/transition.ts`) drives the
scroll alongside the transition:

```ts
const isBack = options?.direction === 'back';
if (!isBack) pushScrollPosition();           // saves window.scrollX/Y
...
viewTransition = startViewTransition(async () => {
  await runNavigation(navigationFn);
  if (isBack) handleBackScroll();            // window.scrollTo(saved)
  else        window.scrollTo(0, 0);
});
```

`pushScrollPosition` / `handleBackScroll` (in `scroll.ts`) read and write
`window.scrollX/Y` and `window.scrollTo`. That is correct when the
**document** is the scroller — which is the default for most pages.

The problem is on WebKit specifically: the root snapshot for a scrolled
document is taken from the document top, not from the current scroll
offset. So even though `pushScrollPosition` recorded the right number, the
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

Then, because the library still calls `window.scrollTo` internally (a
no-op now that the document can't scroll), the app must own scroll
save/restore on the **container** instead:

- Save `container.scrollTop` per history entry.
- Restore it in a **layout effect** (pre-paint). Combined with
  `legacyFlushSync` (React wrapper) the route commits synchronously inside
  the transition callback, so the restore lands **before** the new
  snapshot is captured and there is no visible jump.
- Repoint everything else that read the document scroll —
  `IntersectionObserver` roots, pull-to-refresh, "header shadow on scroll"
  listeners — at the container.

A full reference implementation lives in the `epyt-app` web client
(`apps/web`): `useScrollContainer`, `useScrollRestoration`, and the
`useNavigateWithTransition` wrapper passing `legacyFlushSync: true`.

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

**What the library *can* do** is stop assuming the document is the
scroller, so apps that adopt the container pattern don't have to disable
the library's scroll handling and reimplement restoration. See below.

## Proposed library fix

Add an optional scroll root to `TransitionOptions` (and surface it through
the React/Vue wrappers):

```ts
export interface TransitionOptions {
  // ...
  /**
   * Element that owns the scroll position for this navigation. When set,
   * scroll save/restore targets this element (`scrollTop`/`scrollLeft`,
   * `el.scrollTo`) instead of the window. Apps that move scrolling into a
   * container (recommended on iOS WebViews — see docs) pass it here so the
   * library manages restoration for them.
   *
   * Accepts an element or a getter (resolved at call time, since the
   * element may mount after the hook is created).
   */
  scrollRoot?: Element | (() => Element | null);
}
```

Plumbing (all in `packages/core/src`):

1. `scroll.ts` — `createScrollStore` reads `root.scrollLeft/scrollTop`
   instead of `window.scrollX/Y` in `save`, and the store/`popScrollPosition`
   returns the saved `{x, y}` unchanged. Add a `scrollTo(root, pos)` helper
   that calls `root.scrollTo(...)` (falling back to `window` when no root).
2. `transition.ts` — resolve `const root = resolveScrollRoot(options)` once;
   replace `window.scrollTo(0, 0)` (forward) and `window.scrollTo(saved…)`
   (`handleBackScroll`) with the root-aware helper. `pushScrollPosition`
   reads the same root.
3. React wrapper — accept `scrollRoot` in `TransitionNavigateOptions`, pass
   it through; document that callers should still pin the document via CSS
   (the library can't do that part).

This keeps the default (window) behavior unchanged — `scrollRoot` is
opt-in — and lets a container-based app drop its hand-rolled restoration.
It does **not** by itself remove the WebKit flash: the app must still pin
the document so the root snapshot is captured at top == on-screen. The
option just removes the need to fight the library while doing so.

A short companion note belongs in the README (link here from the
"Browser Support" or a new "Scrolling" section), since the WebKit caveat
will bite anyone shipping inside an iOS WebView.

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
