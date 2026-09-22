---
'@lemoncloud/page-transition-core': patch
'@lemoncloud/react-page-transition': patch
'@lemoncloud/vue-page-transition': patch
---

Hold the back transition open until the router has committed the destination.

`navigate(-1)` / `router.go(-1)` is `history.go(-1)`, which only queues the
traversal — the router hears `popstate` in a later task. The View Transitions
callback used to end after one microtask with the page being left still in the
DOM, so the "new" snapshot was taken of the wrong page and the restored back
offset was applied to the wrong DOM. `MemoryRouter` hid this because its `go()`
is synchronous.

Numeric hops now wait for the route commit: the React hook watches
`useLocation().key` from a layout-effect cleanup (a back navigation usually
unmounts the component that owns the hook), the Vue composable waits for
`router.afterEach` plus one tick. Hops that never change the location — past
either end of the stack, blocked by a guard — fall back after 500ms. A second
hop before the first commits releases the earlier waiter.

Core now resolves the destination entry's scroll key *before* the navigation
runs. Reading `history.state` after the commit would name the entry beyond the
destination.

Docs: a section on the app-side trap behind the "white screen on swipe-back"
report — `history.scrollRestoration = 'manual'` makes WKWebView reject its
gesture snapshot whenever the two pages are scrolled differently
(`ViewGestureControllerIOS.mm`, `canUseSnapshot`) — plus the back-restoration
behaviour by version (1.3.0 / 1.4.0 / 1.4.1) and the cost of pinning the
document.
