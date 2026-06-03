---
'@lemoncloud/page-transition-core': minor
'@lemoncloud/react-page-transition': minor
'@lemoncloud/vue-page-transition': minor
---

Hardens the View Transitions adapter against issues that surface in
hybrid React Native + React Router apps:

- Concurrent navigation dedup: a new in-flight `ViewTransition` is
  tracked centrally and any previous one is `skipTransition()`-ed
  before the new one starts. The superseded caller is notified via
  `onSkipped('superseded')`.
- `navigationFn` is now awaited inside the View Transitions
  callback so async router commits (and React 18 transitions)
  snapshot the correct DOM. The React adapter drops `flushSync` by
  default and exposes `legacyFlushSync: true` as an escape hatch
  for the prior behavior.
- `prefers-reduced-motion` short-circuits the animation. Throws
  from `matchMedia` (some opaque-origin WebViews) are caught.
- `TransitionOptions` adds `signal`, `onSkipped`, and the
  `SkipReason` union (`'unsupported' | 'reduced-motion' |
  'animation-none' | 'aborted' | 'superseded'`). React and Vue
  adapters forward both. `useGoBack` accepts the same option subset.
  An already-aborted signal short-circuits the no-transition branch
  as well.
- Scroll positions are keyed by `history.state.key` (or `idx` / URL
  fallback) instead of a global LIFO stack, so `replace: true` and
  `history.go(n)` no longer desync. `pushScrollPosition`,
  `popScrollPosition`, and `clearScrollStack` remain as
  `@deprecated` shims slated for v2.0.
- Removed the `document.startViewTransition!` non-null assertion in
  favor of a type guard. Added SSR guards on every direct
  `document` / `window` touch. Scroll entries are popped when the
  View Transitions callback throws so a failing navigation no
  longer leaks an entry.

All new options are optional and the default visual behavior is
unchanged — minor release.
