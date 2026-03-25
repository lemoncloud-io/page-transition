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
}
```

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
