# Known issues found while adopting v1.3.0 (muzly-app)

Findings from wiring `@lemoncloud/react-page-transition` into `muzly-app`
(`apps/web`, React 19 + react-router-dom 7 component `<Routes>` API, running
inside a React Native WKWebView shell). Every claim below cites this repo's
source at 1.3.0; measurements were taken against the published dist under
Playwright and are marked as such.

Ordered by severity.

## Status — all five addressed in 1.4.0

| Issue | Resolution |
|---|---|
| 1. Back-restore reads the wrong history key | Fixed. The destination entry is now found by **ordinal** (`history.state.idx` / `history.state.position`) plus a new `TransitionOptions.delta`, instead of a key that has not settled. Plan: `docs/plan-scroll-restore-ordinal.md` |
| 2. `scrolling-and-view-transitions.md` is stale | Fixed. "Proposed library fix" is now "Using `scrollRoot`" |
| 3. `restore()` deletes on read | Fixed. Restore no longer consumes; a separate internal `discard(key)` owns error rollback |
| 4. `replace: true` silently disables the transition | Documented in the README option table |
| 5. Unmount flash undocumented | Documented in `scrolling-and-view-transitions.md`, recorded as a *partial* fix |

A defect this report did not cover was found while fixing issue 1: `currentKey()`
claimed vue-router populates `history.state.key`, which it does not — Vue apps
fell through to a URL + `history.length` fallback that changes as entries are
pushed, so their lookups missed even when the timing was right. The ordinal path
covers both routers.

Line references below are as of 1.3.0 and are left unchanged as the historical
record.

---

## 1. Back-navigation scroll restore reads the wrong history key — it never fires

**Severity: high.** The feature is shipped, unit-tested green, and does nothing
in a real router.

### Mechanism

`handleBackScroll` (`packages/core/src/transition.ts:124`) calls
`popScrollPosition()`, which resolves its key through `currentKey()`
(`packages/core/src/scroll.ts:46`) — that is, `window.history.state.key`,
read *at restore time*.

The save and the restore are keyed off two different history entries:

| Step | `history.state.key` at that moment | Store operation |
|---|---|---|
| Forward A → B, before `startViewTransition` (`transition.ts:191`) | `A` | `save[A] = A.scrollTop` |
| Back B → A, inside the VT callback (`transition.ts:216`) | **still `B`** | `restore(B)` → miss |

The restore needs key `A` (the destination) and asks for `B` (the entry being
left). It is off by exactly one entry, in every direction, so the lookup always
misses and no scroll is ever restored.

### Why `history.state` is still the departing entry

`runNavigation` is awaited (`transition.ts:203`), but for a back navigation the
navigate call is `history.go(-1)`, which is **asynchronous**: the browser
dispatches `popstate` on a later task and only then does `history.state` — and
react-router's own `location` — update. Awaiting the navigate function
therefore guarantees nothing about the history entry. `legacyFlushSync` does
not help either; it flushes React, not the browser's history queue.

Measured in `muzly-app` by instrumenting `document.startViewTransition` and
logging `history.state` immediately after `await runNavigation()` on a
`navigate(-1)`:

```
stateAfterNav: {"key":"v4m7m90r","idx":1}   // the entry being left, not the destination
```

This has a second implication worth checking separately: if `history.state` has
not settled, react-router has not committed the destination route either, so
for back navigations the View Transitions snapshot may be captured before the
DOM actually swaps.

### Why the test suite is green

`transition.test.ts:215` ("restores the saved container offset on back
navigation") passes a synchronous no-op as `navigationFn` and pins
`history.state` to `{ key: 'sr-key' }` once in `beforeEach`
(`transition.test.ts:167`). The key is therefore identical on the forward save
and the back restore, and the lookup hits. No test in the suite mutates
`history.state` *between* a forward and a back call, so this class of bug
cannot be caught.

A regression test should replace the current one: save under key `A`, then
change `history.state` to `B` (or, better, drive a real `MemoryRouter`), then
run the back transition and assert the restore still lands.

### Fix options

1. **Let the caller supply the key.** Add `scrollKey?: string | (() => string)`
   next to `scrollRoot`, resolved at call time. Routers already expose a stable
   per-entry key (`useLocation().key` in react-router, `route.fullPath` +
   history key in vue-router), and the caller knows the *destination* key
   before the pop settles in a way the library cannot. Cheapest, race-free,
   symmetric with the existing `scrollRoot` escape hatch.
2. **Wait for the entry to settle.** Inside the callback, `await` the next
   `popstate` (with a timeout, since `direction: 'back'` can be passed on a
   push navigation) before reading the key. Correct in principle, but it adds a
   race to the pre-paint window that the whole design is trying to avoid.
3. **Track the keys the library itself pushed** and restore the most recent
   one on back. This is the old LIFO stack that `scroll.ts`'s header comment
   says was removed for desyncing under `replace: true` / `history.go(n)`; it
   would need the desync fixed rather than reintroduced as-is.

Option 1 is the recommendation.

### What consumers have to do today

Re-implement restoration at app level, keyed on the router's own entry key and
applied in a layout effect. `muzly-app`'s `apps/web/src/hooks/useScrollRestoration.ts`
and the `epyt-app` implementation the docs already point at are both this
workaround. That is fine as a documented escape hatch, but the library
currently ships an API (`scrollRoot` + back restore) that reads as if it covers
the case and silently does not.

---

## 2. `docs/scrolling-and-view-transitions.md` is stale — it proposes a feature that shipped

**Severity: medium (docs).** The document's TL;DR still says:

> "Today the library hard-codes `window.scroll*` for its scroll save/restore,
> so an app that adopts a scroll container has to disable that and reimplement
> restoration itself."

and carries a "## Proposed library fix" section adding `scrollRoot`. That
option shipped in 1.3.0: `TransitionOptions.scrollRoot`
(`packages/core/src/types.ts:92`), resolved at `transition.ts:119`, threaded
through both wrappers (`packages/react/src/types.ts:108`,
`packages/vue/src/types.ts:113`). `scroll.ts` is root-aware
(`readScrollPosition` / `applyScrollPosition`) and `pushScrollPosition` is even
`@deprecated` in favour of it (`scroll.ts:91`).

A reader following the doc reimplements what they could have configured. The
"Proposed library fix" section should become "Using `scrollRoot`", and — given
issue 1 — should state plainly that `scrollRoot` fixes the **forward** half
(reset-to-top on the new page) while back restoration is still the app's job
until issue 1 is resolved.

Measured in `muzly-app` for the forward half: container offset 700 → 0 on a
forward navigation once `scrollRoot` was passed; without it, `window.scrollTo`
is a no-op on a pinned document and the new page opened at the previous page's
offset.

---

## 3. `restore()` deletes on read

**Severity: low, design question.** `createScrollStore.restore`
(`scroll.ts:71-77`) removes the entry it returns. Once issue 1 is fixed this
becomes reachable: a user who goes back to A (restore, entry consumed), then
forward via the browser's own forward button (no library call, so no re-save),
then back to A again gets no restoration the second time. Browser-native
scroll restoration keeps the position for the life of the entry.

Suggest keeping the entry and letting LRU eviction (`DEFAULT_MAX_ENTRIES = 50`)
own the lifetime, unless the delete is load-bearing for the
`consumeScrollEntry` balancing in `transition.ts:196-200`.

---

## 4. `replace: true` silently disables the transition

**Severity: low, API ergonomics.** `shouldTransition = transition ?? !navigateOptions.replace`
(`packages/react/src/useNavigateWithTransition.ts:66`; the Vue wrapper does the
same). It is documented in the hook's JSDoc, so this is not a defect — but it
is the kind of default that reads as a broken animation rather than a
deliberate one, and it is not in the README. `muzly-app` hit it on two
`replace`-based flows and had to pass `transition: true` explicitly.

Suggest a line in the README's option table.

---

## 5. Docs cover the scroll flash but not the unmount flash

**Severity: low (docs gap).** `scrolling-and-view-transitions.md` explains the
WebKit root-snapshot-from-top problem thoroughly. There is a second WKWebView
flicker with a different cause: if the route change **unmounts a large
subtree** (e.g. a full-screen route declared as a sibling of the tab-shell
route rather than a child of it), the snapshot is captured against a
half-torn-down tree.

The fix is structural and app-side: keep the shell route mounted and let only
the `<Outlet>` content swap, hiding chrome with CSS instead of unmounting it.
Verified in `muzly-app` by asserting the shell element is the same node across
the navigation (`shellIsSameNode: true`) after moving the immersive routes
inside the shell route.

Worth one paragraph in the consumer checklist, since it is invisible until you
are on a device. Note that `epyt-app`'s own note on this records the flicker as
only *partially* solved by the structural fix — the WKWebView snapshot limit
remains — so the paragraph should not promise a complete fix.

---

## Source

- Adoption branch: `muzly-app` `feat/web-page-transition` (2026-08-28)
- Library version read: `packages/core` 1.3.0 (this repo, `main`); runtime
  measurements against the published 1.3.0 dist
