# @lemoncloud/react-page-transition

## 1.4.0

### Minor Changes

- 1a06a84: Fix back-navigation scroll restoration, which never fired in a real router.

    The restore looked the destination entry up by `history.state.key`, read inside
    the View Transitions callback. `history.go(-1)` is asynchronous, so at that
    moment the state still describes the entry being _left_ — the lookup was off by
    one entry in every direction and always missed. Vue apps missed for a second
    reason: vue-router populates neither `key` nor `idx`, so every lookup fell
    through to a URL + `history.length` fallback that changes as entries are pushed.

    The destination is now identified by its ordinal (`history.state.idx` for
    react-router, `history.state.position` for vue-router) offset by the hop count,
    exposed as the new `TransitionOptions.delta`. The React and Vue wrappers derive
    it from a backward numeric `to`, and pass `0` for a path navigation or a forward
    hop — neither names an entry that can already hold a saved offset, so a
    navigation that merely _animates_ as a back navigation cannot pull a stale offset
    onto the new page.

    Restoring an entry no longer consumes it, so a back → browser-forward → back
    cycle restores both times, matching native scroll restoration. Error rollback
    now discards by the key it saved rather than re-reading the current entry, which
    may already have advanced.

    `pushScrollPosition`, `popScrollPosition`, and `clearScrollStack` keep their
    existing signatures and behaviour.

### Patch Changes

- Updated dependencies [1a06a84]
    - @lemoncloud/page-transition-core@1.4.0

## 1.3.0

### Minor Changes

- 5d18b99: Add `scrollRoot` option for container-based scrolling.

    Scroll save/restore previously assumed the document was the scroller
    (`window.scrollX/Y`, `window.scrollTo`). Apps that scroll a container
    instead — recommended inside iOS WebViews, where a scrolled _document_
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

### Patch Changes

- b0c3d6e: Tune the default iOS slide timing.

    `--pt-slide-duration` 350ms → 380ms and `--pt-slide-easing`
    `cubic-bezier(0.32, 0.72, 0, 1)` → `cubic-bezier(0.32, 0.5, 0.05, 1)`.
    The previous curve was front-loaded and read as a snap on high-refresh
    WebViews; the new curve starts more linearly and decelerates later.

    Consumers overriding these CSS custom properties are unaffected.

- Updated dependencies [b0c3d6e]
- Updated dependencies [5d18b99]
    - @lemoncloud/page-transition-core@1.3.0

## 1.2.0

### Minor Changes

- 7685967: Hardens the View Transitions adapter against issues that surface in
  hybrid React Native + React Router apps: - Concurrent navigation dedup: a new in-flight `ViewTransition` is
  tracked centrally and any previous one is `skipTransition()`-ed
  before the new one starts. The superseded caller is notified via
  `onSkipped('superseded')`. - `navigationFn` is now awaited inside the View Transitions
  callback so async router commits (and React 18 transitions)
  snapshot the correct DOM. The React adapter drops `flushSync` by
  default and exposes `legacyFlushSync: true` as an escape hatch
  for the prior behavior. - `prefers-reduced-motion` short-circuits the animation. Throws
  from `matchMedia` (some opaque-origin WebViews) are caught. - `TransitionOptions` adds `signal`, `onSkipped`, and the
  `SkipReason` union (`'unsupported' | 'reduced-motion' |
'animation-none' | 'aborted' | 'superseded'`). React and Vue
  adapters forward both. `useGoBack` accepts the same option subset.
  An already-aborted signal short-circuits the no-transition branch
  as well. - Scroll positions are keyed by `history.state.key` (or `idx` / URL
  fallback) instead of a global LIFO stack, so `replace: true` and
  `history.go(n)` no longer desync. `pushScrollPosition`,
  `popScrollPosition`, and `clearScrollStack` remain as
  `@deprecated` shims slated for v2.0. - Removed the `document.startViewTransition!` non-null assertion in
  favor of a type guard. Added SSR guards on every direct
  `document` / `window` touch. Scroll entries are popped when the
  View Transitions callback throws so a failing navigation no
  longer leaks an entry.

            All new options are optional and the default visual behavior is
            unchanged — minor release.

### Patch Changes

- Updated dependencies [7685967]
    - @lemoncloud/page-transition-core@1.2.0

## 1.0.0

### Major Changes

- df960f6: align animations with modern design systems

### Patch Changes

- Updated dependencies [df960f6]
    - @lemoncloud/page-transition-core@1.0.0

## 0.1.1

### Patch Changes

- Updated dependencies [5478fa1]
    - @lemoncloud/page-transition-core@0.1.1

## 0.1.0

### Minor Changes

- 87244ee: Add CSS customization API for animation timing overrides
    - CSS custom properties (`--pt-slide-duration`, `--pt-fade-duration`, etc.) for global theming
    - Per-navigation `customization` option with `duration` and `easing` overrides
    - Remove dead code: `ANIMATION_NONE_CLASS`, identity keyframes
    - Add Customize tab to example app

- 39620b8: Add Vue and Angular support with shared core package
    - New package: @lemoncloud/page-transition-core (framework-agnostic)
    - New package: @lemoncloud/vue-page-transition (Vue composables)
    - Angular: Use core CSS with built-in withViewTransitions()
    - React: No breaking changes, same API

### Patch Changes

- Updated dependencies [87244ee]
- Updated dependencies [39620b8]
    - @lemoncloud/page-transition-core@0.1.0
