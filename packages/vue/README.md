# @lemoncloud/vue-page-transition

[![npm](https://img.shields.io/npm/v/@lemoncloud/vue-page-transition.svg)](https://www.npmjs.com/package/@lemoncloud/vue-page-transition)
[![size](https://img.shields.io/bundlephobia/minzip/@lemoncloud/vue-page-transition)](https://bundlephobia.com/package/@lemoncloud/vue-page-transition)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

iOS/Android-style page transitions for Vue using the View Transitions API.

## Installation

```bash
npm install @lemoncloud/vue-page-transition
```

**Peer Dependencies:** `vue >= 3.0.0`, `vue-router >= 4.0.0`

## Quick Start

```vue
<script setup lang="ts">
// 1. Import CSS (once in main.ts or App.vue)
import '@lemoncloud/page-transition-core/styles.css';

// 2. Use the composable
import { useNavigateWithTransition } from '@lemoncloud/vue-page-transition';

const { navigate, goBack } = useNavigateWithTransition();
</script>

<template>
    <button @click="navigate('/settings')">Settings</button>
    <button @click="goBack()">Back</button>
</template>
```

## API

### `useNavigateWithTransition(config?)`

```ts
const { navigate, goBack } = useNavigateWithTransition({
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

```ts
// Forward navigation
navigate('/settings');

// Back navigation
navigate(-1);
// or
goBack();

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
