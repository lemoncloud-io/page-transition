# @lemoncloud/react-page-transition

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
