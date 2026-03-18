# @lemoncloud/react-page-transition

[![npm](https://img.shields.io/npm/v/@lemoncloud/react-page-transition.svg)](https://www.npmjs.com/package/@lemoncloud/react-page-transition)
[![size](https://img.shields.io/bundlephobia/minzip/@lemoncloud/react-page-transition)](https://bundlephobia.com/package/@lemoncloud/react-page-transition)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

iOS/Android-style page transitions for React using the View Transitions API.

## Installation

```bash
npm install @lemoncloud/react-page-transition
```

**Peer Dependencies:** `react >= 18.0.0`, `react-router-dom >= 6.0.0`

## Quick Start

```tsx
// 1. Import CSS (once in main.tsx)
import '@lemoncloud/page-transition-core/styles.css';

// 2. Use the hook
import { useNavigateWithTransition } from '@lemoncloud/react-page-transition';

function MyComponent() {
    const navigate = useNavigateWithTransition();

    return (
        <>
            <button onClick={() => navigate('/settings')}>Settings</button>
            <button onClick={() => navigate(-1)}>Back</button>
        </>
    );
}
```

## API

### `useNavigateWithTransition(config?)`

```ts
const navigate = useNavigateWithTransition({
    platform: 'auto',      // 'ios' | 'android' | 'auto'
    detectPlatform: () => 'ios' | 'android' | undefined
});
```

### Navigation Options

```ts
navigate('/path', {
    transition: true,       // Enable animation (default: true)
    direction: 'forward',   // 'forward' | 'back'
    animation: 'slide',     // 'slide' | 'lift' | 'fade' | 'zoom' | 'none'
    replace: false          // Replace history (disables transition by default)
});
```

### Examples

```tsx
// Forward navigation
navigate('/settings');

// Back navigation
navigate(-1);

// Path with back animation
navigate('/home', { direction: 'back' });

// Modal with fade
navigate('/modal', { animation: 'fade' });

// Tab switch (no animation)
navigate('/tab', { replace: true });

// Await transition completion
await navigate('/page');
console.log('Transition complete!');
```

### `useGoBack(config?)`

Convenience hook for back navigation.

```tsx
import { useGoBack } from '@lemoncloud/react-page-transition';

function Header() {
    const goBack = useGoBack();
    return <button onClick={goBack}>← Back</button>;
}
```

## Animation Types

| Type | Duration | Use Case |
|------|----------|----------|
| `slide` | 350ms | iOS default |
| `lift` | 100ms | Android default |
| `fade` | 200ms | Modals |
| `zoom` | 250ms | Galleries |

## Browser Support

Chrome 111+, Edge 111+, Safari 18+, Firefox 133+

Unsupported browsers fall back to instant navigation.

## License

MIT © [LemonCloud](https://lemoncloud.io)
