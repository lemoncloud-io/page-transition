# Page Transition

[![npm version](https://img.shields.io/npm/v/@lemoncloud/react-page-transition.svg)](https://www.npmjs.com/package/@lemoncloud/react-page-transition)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**Mobile-app-like page transition animations using the [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API).**

Supports **React**, **Vue**, and **Angular**.

| iOS Style | Android Style |
|:---------:|:-------------:|
| ![iOS](https://raw.githubusercontent.com/lemoncloud-io/react-page-transition/main/.github/ios.gif) | ![Android](https://raw.githubusercontent.com/lemoncloud-io/react-page-transition/main/.github/android.gif) |
| Horizontal slide (350ms) | Vertical lift (100ms) |

---

## Packages

| Package | Description |
|---------|-------------|
| [`@lemoncloud/page-transition-core`](./packages/core) | Framework-agnostic core + CSS |
| [`@lemoncloud/react-page-transition`](./packages/react) | React hooks |
| [`@lemoncloud/vue-page-transition`](./packages/vue) | Vue composables |

> **Angular:** Uses built-in `withViewTransitions()`. Only needs CSS from core package (no wrapper package).

---

## Installation

### React

```bash
npm install @lemoncloud/react-page-transition
```

```tsx
// main.tsx
import '@lemoncloud/react-page-transition/styles.css';

// Component
import { useNavigateWithTransition } from '@lemoncloud/react-page-transition';

const MyComponent = () => {
    const navigate = useNavigateWithTransition();
    return <button onClick={() => navigate('/settings')}>Settings</button>;
};
```

### Vue

```bash
npm install @lemoncloud/vue-page-transition
```

```ts
// main.ts
import '@lemoncloud/page-transition-core/styles.css';

// Component
import { useNavigateWithTransition } from '@lemoncloud/vue-page-transition';

const { navigate, goBack } = useNavigateWithTransition();
navigate('/settings');
```

### Angular

Angular 17+ has built-in View Transitions support. Just import the CSS:

```bash
npm install @lemoncloud/page-transition-core
```

```ts
// main.ts
import { provideRouter, withViewTransitions } from '@angular/router';

bootstrapApplication(AppComponent, {
    providers: [provideRouter(routes, withViewTransitions())]
});
```

```css
/* angular.json - add to styles array */
"styles": [
    "node_modules/@lemoncloud/page-transition-core/dist/styles.css",
    "src/styles.css"
]
```

For back navigation animation, add `back-navigation` class:

```ts
// In your component
goBack() {
    document.documentElement.classList.add('back-navigation');
    this.location.back();
}
```

---

## Browser Support

Chrome 111+, Edge 111+, Safari 18+, Firefox 133+

Unsupported browsers fall back to instant navigation.

---

## API Reference

### React / Vue

```ts
const navigate = useNavigateWithTransition(config?);

// Config options
{
    platform?: 'ios' | 'android' | 'auto',  // Animation style (default: 'auto')
    detectPlatform?: () => 'ios' | 'android' | undefined  // Custom detector
}

// Navigate options
navigate('/path', {
    transition?: boolean,      // Enable/disable animation (default: true)
    direction?: 'forward' | 'back',  // Override direction
    animation?: 'slide' | 'lift' | 'fade' | 'zoom' | 'none',  // Animation type
    replace?: boolean,         // Replace history (disables transition by default)
});

// Back navigation
navigate(-1);  // or useGoBack() hook
```

---

## Animation Styles

| Style | Duration | Use Case |
|-------|----------|----------|
| `slide` | 350ms | iOS default |
| `lift` | 100ms | Android default |
| `fade` | 200ms | Modals |
| `zoom` | 250ms | Galleries |

---

## Development

```bash
pnpm install
pnpm build        # Build all packages
pnpm dev          # Watch mode
pnpm test         # Run tests
```

### Run Examples

```bash
pnpm --filter @example/basic dev    # React (localhost:3000)
pnpm --filter @example/vue dev      # Vue (localhost:3001)
pnpm --filter @example/angular dev  # Angular (localhost:4200)
```

---

## License

MIT © [LemonCloud](https://lemoncloud.io)
