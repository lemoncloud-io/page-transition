# Page Transition

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**iOS/Android-style page transitions using the [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API).**
Built for hybrid mobile apps that need native-feeling navigation in WebView.

| iOS Style | Android Style |
|:---------:|:-------------:|
| ![iOS](https://raw.githubusercontent.com/lemoncloud-io/page-transition/main/.github/ios.gif) | ![Android](https://raw.githubusercontent.com/lemoncloud-io/page-transition/main/.github/android.gif) |
| Horizontal slide (350ms) | Vertical lift (100ms) |

## Features

- iOS/Android platform auto-detection
- Multiple animation types (slide, lift, fade, zoom)
- Promise-based navigation
- SSR safe
- Zero dependencies (except framework peer deps)

## Packages

| Package | Version | Size | Description |
|---------|---------|------|-------------|
| [@lemoncloud/react-page-transition](./packages/react) | [![npm](https://img.shields.io/npm/v/@lemoncloud/react-page-transition.svg)](https://www.npmjs.com/package/@lemoncloud/react-page-transition) | [![size](https://img.shields.io/bundlephobia/minzip/@lemoncloud/react-page-transition)](https://bundlephobia.com/package/@lemoncloud/react-page-transition) | React hooks |
| [@lemoncloud/vue-page-transition](./packages/vue) | [![npm](https://img.shields.io/npm/v/@lemoncloud/vue-page-transition.svg)](https://www.npmjs.com/package/@lemoncloud/vue-page-transition) | [![size](https://img.shields.io/bundlephobia/minzip/@lemoncloud/vue-page-transition)](https://bundlephobia.com/package/@lemoncloud/vue-page-transition) | Vue composables |
| [@lemoncloud/page-transition-core](./packages/core) | [![npm](https://img.shields.io/npm/v/@lemoncloud/page-transition-core.svg)](https://www.npmjs.com/package/@lemoncloud/page-transition-core) | [![size](https://img.shields.io/bundlephobia/minzip/@lemoncloud/page-transition-core)](https://bundlephobia.com/package/@lemoncloud/page-transition-core) | Core + CSS |

> **Angular 17+:** Uses built-in `withViewTransitions()`. Only needs CSS from core package.

## Quick Start

### React

```bash
npm install @lemoncloud/react-page-transition
```

```tsx
// main.tsx
import '@lemoncloud/page-transition-core/styles.css';
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

### Vue

```bash
npm install @lemoncloud/vue-page-transition
```

```vue
<script setup lang="ts">
import '@lemoncloud/page-transition-core/styles.css';
import { useNavigateWithTransition } from '@lemoncloud/vue-page-transition';

const { navigate, goBack } = useNavigateWithTransition();
</script>

<template>
    <button @click="navigate('/settings')">Settings</button>
    <button @click="goBack()">Back</button>
</template>
```

### Angular

```bash
npm install @lemoncloud/page-transition-core
```

```typescript
// main.ts
import { provideRouter, withViewTransitions } from '@angular/router';

bootstrapApplication(AppComponent, {
    providers: [provideRouter(routes, withViewTransitions())]
});
```

```json
// angular.json - add to styles array
"styles": [
    "node_modules/@lemoncloud/page-transition-core/dist/styles.css",
    "src/styles.css"
]
```

## API

```ts
const navigate = useNavigateWithTransition({
    platform?: 'ios' | 'android' | 'auto',  // default: 'auto'
    detectPlatform?: () => 'ios' | 'android' | undefined
});

// Navigation
navigate('/path');                          // Forward
navigate(-1);                               // Back
navigate('/home', { direction: 'back' });   // Path with back animation
navigate('/modal', { animation: 'fade' });  // Custom animation
navigate('/tab', { replace: true });        // No transition (tab switch)
```

### Animation Types

| Type | Duration | Use Case |
|------|----------|----------|
| `slide` | 350ms | iOS default - horizontal |
| `lift` | 100ms | Android default - vertical |
| `fade` | 200ms | Modals, overlays |
| `zoom` | 250ms | Galleries, images |
| `none` | 0ms | Instant switch |

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 111+ |
| Edge | 111+ |
| Safari | 18+ |
| Firefox | 133+ |

Unsupported browsers fall back to instant navigation (no animation).

## Development

```bash
pnpm install
pnpm build        # Build all packages
pnpm dev          # Watch mode
pnpm test         # Run tests (42 tests)
```

### Examples

```bash
pnpm --filter @example/basic dev    # React - localhost:3000
pnpm --filter @example/vue dev      # Vue - localhost:3001
pnpm --filter @example/angular dev  # Angular - localhost:4200
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push (`git push origin feature/amazing`)
5. Open Pull Request

## License

MIT © [LemonCloud](https://lemoncloud.io)
