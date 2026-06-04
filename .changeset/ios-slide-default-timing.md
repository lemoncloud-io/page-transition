---
'@lemoncloud/page-transition-core': patch
'@lemoncloud/react-page-transition': patch
'@lemoncloud/vue-page-transition': patch
---

Tune the default iOS slide timing.

`--pt-slide-duration` 350ms → 380ms and `--pt-slide-easing`
`cubic-bezier(0.32, 0.72, 0, 1)` → `cubic-bezier(0.32, 0.5, 0.05, 1)`.
The previous curve was front-loaded and read as a snap on high-refresh
WebViews; the new curve starts more linearly and decelerates later.

Consumers overriding these CSS custom properties are unaffected.
