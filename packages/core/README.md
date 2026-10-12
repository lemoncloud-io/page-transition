# @lemoncloud/page-transition-core

[![npm](https://img.shields.io/npm/v/@lemoncloud/page-transition-core.svg)](https://www.npmjs.com/package/@lemoncloud/page-transition-core)
[![size](https://img.shields.io/bundlephobia/minzip/@lemoncloud/page-transition-core)](https://bundlephobia.com/package/@lemoncloud/page-transition-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Framework-agnostic page transition core using the View Transitions API.

## Installation

```bash
npm install @lemoncloud/page-transition-core
```

## Usage

### CSS Only (Angular, Vanilla JS)

```ts
import '@lemoncloud/page-transition-core/styles.css';
```

Angular 17+ example:

```ts
import { provideRouter, withViewTransitions } from '@angular/router';

bootstrapApplication(AppComponent, {
    providers: [provideRouter(routes, withViewTransitions())]
});
```

### Programmatic API

```ts
import {
    executePageTransition,
    isViewTransitionSupported,
    detectPlatform
} from '@lemoncloud/page-transition-core';

// Check support
if (isViewTransitionSupported()) {
    // Execute with transition
    await executePageTransition(
        () => router.navigate('/next'),
        {
            direction: 'forward',
            animation: 'slide',
            config: { platform: 'ios' }
        }
    );
}

// Detect platform
const platform = detectPlatform(); // 'ios' | 'android' | undefined
```

## API

### `executePageTransition(navigationFn, options?)`

Wraps a navigation function with View Transitions API.

```ts
interface TransitionOptions {
    direction?: 'forward' | 'back';
    animation?: 'slide' | 'lift' | 'fade' | 'zoom' | 'none';
    config?: {
        platform?: 'ios' | 'android' | 'auto';
        detectPlatform?: () => 'ios' | 'android' | undefined;
    };
    customization?: { duration?: number; easing?: string };
    /** Cancel a navigation. Aborting before start skips it entirely. */
    signal?: AbortSignal;
    /** Notified when an animation was bypassed. Useful for analytics / debugging. */
    onSkipped?: (reason: SkipReason) => void;
    /** Phase durations once an animated transition settles. Opt-in. */
    onTiming?: (timing: TransitionTiming) => void;
}

type SkipReason =
    | 'unsupported'
    | 'reduced-motion'
    | 'animation-none'
    | 'aborted'
    | 'superseded';
```

Concurrent calls are deduped automatically — a new `executePageTransition`
calls `skipTransition()` on any in-flight transition and notifies its
caller via `onSkipped('superseded')`.

The navigation callback may be `async`; the View Transitions API
natively awaits it so async router commits stay snapshot-consistent.

#### Measuring a transition (`onTiming`)

`onTiming` tells a freeze after the tap apart from stutter during the
motion. It is called once per animated transition, after it settles, with
phase durations in milliseconds:

```ts
interface TransitionTiming {
    outcome: 'finished' | 'skipped' | 'error';
    capture?: number;     // call → callback entry (old snapshot)
    update?: number;      // callback → updateCallbackDone (navigation + new page render)
    start?: number;       // updateCallbackDone → ready (new snapshot)
    animation?: number;   // ready → finished ('finished' only)
    frames?: number;      // requestAnimationFrame ticks during the animation
    maxFrameGap?: number; // longest gap between those ticks
}

executePageTransition(navigate, {
    onTiming: (t) => console.table(t),
});
```

A phase the transition never reached is `undefined`: a superseded or aborted
transition reports `'skipped'` without `animation` or frame stats, a
navigation that throws reports `'error'` with only `capture`. Navigations that
skip the animation up front (`unsupported`, `reduced-motion`,
`animation: 'none'`) go to `onSkipped` instead.

Reading the numbers:

- **Long `update`** — the page is frozen while the router commits and the
  new page renders. Shrink that work: prefetch lazy route chunks before
  navigating, keep the new page's first render light.
- **Large `maxFrameGap`** — the main thread missed frames during the motion.
  `requestAnimationFrame` only sees the main thread; if the motion stutters
  while `maxFrameGap` stays near 16ms, check the compositor in the browser's
  rendering timeline (Safari Web Inspector → Timelines).
- A backgrounded tab pauses `requestAnimationFrame`, so `maxFrameGap` from a
  hidden page is meaningless.
- A browser that cuts the animation short *after* it started (e.g. the page
  was hidden) still fulfils `finished`, so that transition reports
  `'finished'` with a shorter `animation`.

Only while `onTiming` is set, the library counts frames and leaves
`pt:capture`, `pt:update`, `pt:start` and `pt:animation` measures on the
performance timeline, so the phases also show up in DevTools recordings.
The library never clears them — call `performance.clearMeasures()` if a long
measuring session piles up entries.

### `isViewTransitionSupported()`

Returns `true` if View Transitions API is available.

### `detectPlatform()`

Detects platform from user agent. Returns `'ios'`, `'android'`, or `undefined`.

## Animation Styles

| Type | Duration | Description |
|------|----------|-------------|
| `slide` | 350ms | iOS horizontal slide |
| `lift` | 450ms | Android vertical lift (MD3 SharedAxis Y) |
| `fade` | 350ms | iOS CrossDissolve |
| `zoom` | 350ms | iOS scale with fade |

## Framework Packages

For React/Vue, use the framework-specific packages:

- [@lemoncloud/react-page-transition](https://www.npmjs.com/package/@lemoncloud/react-page-transition)
- [@lemoncloud/vue-page-transition](https://www.npmjs.com/package/@lemoncloud/vue-page-transition)

## License

MIT © [LemonCloud](https://lemoncloud.io)
