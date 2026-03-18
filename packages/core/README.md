# @lemoncloud/page-transition-core

Framework-agnostic page transition animations using the View Transitions API.

## Installation

```bash
npm install @lemoncloud/page-transition-core
```

## Usage

### CSS Only (Angular, Vanilla JS)

```ts
import '@lemoncloud/page-transition-core/styles.css';
```

### With Framework Wrapper

For React/Vue, use the framework-specific packages:
- [`@lemoncloud/react-page-transition`](https://www.npmjs.com/package/@lemoncloud/react-page-transition)
- [`@lemoncloud/vue-page-transition`](https://www.npmjs.com/package/@lemoncloud/vue-page-transition)

### Programmatic API

```ts
import { executePageTransition, isViewTransitionSupported } from '@lemoncloud/page-transition-core';

if (isViewTransitionSupported()) {
    executePageTransition(() => {
        // Your navigation logic
    }, {
        platform: 'ios',      // 'ios' | 'android' | 'auto'
        direction: 'forward', // 'forward' | 'back'
        animation: 'slide',   // 'slide' | 'lift' | 'fade' | 'zoom' | 'none'
    });
}
```

## Animation Styles

| Style | Duration | Description |
|-------|----------|-------------|
| `slide` | 350ms | iOS horizontal slide |
| `lift` | 100ms | Android vertical lift |
| `fade` | 200ms | Crossfade |
| `zoom` | 250ms | Scale with fade |

## License

MIT © [LemonCloud](https://lemoncloud.io)
