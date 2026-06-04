---
'@lemoncloud/page-transition-core': minor
'@lemoncloud/react-page-transition': minor
'@lemoncloud/vue-page-transition': minor
---

Add `scrollRoot` option for container-based scrolling.

Scroll save/restore previously assumed the document was the scroller
(`window.scrollX/Y`, `window.scrollTo`). Apps that scroll a container
instead — recommended inside iOS WebViews, where a scrolled *document*
makes WebKit capture the `::view-transition-old(root)` snapshot from the
top and flash the leaving page at scroll-top 0 — had to disable the
library's scroll handling and reimplement restoration themselves.

`TransitionOptions.scrollRoot` (also on the React/Vue navigate + goBack
options) accepts an `Element` or a getter `() => Element | null`, resolved
when the transition runs. When set, scroll save/restore targets that
element's `scrollTop`/`scrollLeft` and `el.scrollTo(...)` instead of the
window. Default behavior is unchanged (window) when omitted.

Note: this does not by itself remove the WebKit flash — the host must
still keep the document unscrolled (e.g. `body { overflow: hidden }`); the
library cannot do that part. See `docs/scrolling-and-view-transitions.md`.
