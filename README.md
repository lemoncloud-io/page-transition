# @lemoncloud/react-page-transition

[![npm version](https://img.shields.io/npm/v/@lemoncloud/react-page-transition.svg)](https://www.npmjs.com/package/@lemoncloud/react-page-transition)
[![CI](https://github.com/lemoncloud-io/react-page-transition/actions/workflows/ci.yml/badge.svg)](https://github.com/lemoncloud-io/react-page-transition/actions/workflows/ci.yml)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@lemoncloud/react-page-transition)](https://bundlephobia.com/package/@lemoncloud/react-page-transition)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

iOS/Android style page transitions for React using the [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API).

## Demo

Try the [live example](./examples/basic) or run it locally:

```bash
# Clone and run the example
git clone https://github.com/lemoncloud-io/react-page-transition.git
cd react-page-transition
pnpm install
pnpm --filter @example/basic dev
```

| iOS Style | Android Style |
|-----------|---------------|
| Horizontal slide (350ms) | Vertical lift with fade (100ms) |
| ← Slide left/right → | ↑ Lift up/down ↓ |

## Features

- 🍎 **iOS-style** horizontal slide animations
- 🤖 **Android-style** vertical lift animations with fade
- 🔄 **Auto-detection** of platform via user agent
- ⚙️ **Configurable** platform override
- ♿ **Accessible** - respects `prefers-reduced-motion`
- 📦 **Lightweight** - zero dependencies (peer deps only)
- 🔧 **TypeScript** - full type support
- 🎯 **SSR Safe** - works with Next.js and other SSR frameworks

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Full Integration Example](#full-integration-example)
- [API Reference](#api-reference)
- [Animation Styles](#animation-styles)
- [Customization](#customization)
- [Browser Support](#browser-support)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

---

## Installation

```bash
# npm
npm install @lemoncloud/react-page-transition

# pnpm
pnpm add @lemoncloud/react-page-transition

# yarn
yarn add @lemoncloud/react-page-transition
```

### Peer Dependencies

Make sure you have these installed:

```bash
npm install react react-router-dom
```

| Package | Version |
|---------|---------|
| react | >= 18.0.0 |
| react-router-dom | >= 6.0.0 |

---

## Quick Start

### Step 1: Import CSS

Add the CSS import to your app's entry point:

```tsx
// main.tsx or index.tsx
import '@lemoncloud/react-page-transition/styles.css';
```

### Step 2: Use the Hook

Replace `useNavigate` with `useNavigateWithTransition`:

```tsx
import { useNavigateWithTransition } from '@lemoncloud/react-page-transition';

const MyComponent = () => {
    const navigate = useNavigateWithTransition();

    return (
        <div>
            <button onClick={() => navigate('/settings')}>
                Go to Settings
            </button>
            <button onClick={() => navigate(-1)}>
                Go Back
            </button>
        </div>
    );
};
```

That's it! Your app now has native-feeling page transitions.

---

## Full Integration Example

Here's a complete example showing how to integrate with React Router:

### Project Structure

```
src/
├── main.tsx          # Entry point (import CSS here)
├── App.tsx           # Router setup
├── pages/
│   ├── HomePage.tsx
│   ├── SettingsPage.tsx
│   └── ProfilePage.tsx
└── components/
    └── Header.tsx    # Back button component
```

### main.tsx

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Import transition CSS
import '@lemoncloud/react-page-transition/styles.css';

import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);
```

### App.tsx

```tsx
import { Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';

const App = () => {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
        </Routes>
    );
};

export default App;
```

### components/Header.tsx

```tsx
import { useGoBack } from '@lemoncloud/react-page-transition';

interface HeaderProps {
    title: string;
    showBack?: boolean;
}

export const Header = ({ title, showBack = true }: HeaderProps) => {
    const goBack = useGoBack();

    return (
        <header className="header">
            {showBack && (
                <button onClick={goBack} className="back-button">
                    ← Back
                </button>
            )}
            <h1>{title}</h1>
        </header>
    );
};
```

### pages/HomePage.tsx

```tsx
import { useNavigateWithTransition } from '@lemoncloud/react-page-transition';
import { Header } from '../components/Header';

export const HomePage = () => {
    const navigate = useNavigateWithTransition();

    return (
        <div className="page">
            <Header title="Home" showBack={false} />

            <nav>
                <button onClick={() => navigate('/settings')}>
                    Settings
                </button>
                <button onClick={() => navigate('/profile')}>
                    Profile
                </button>
            </nav>
        </div>
    );
};
```

### pages/SettingsPage.tsx

```tsx
import { useNavigateWithTransition } from '@lemoncloud/react-page-transition';
import { Header } from '../components/Header';

export const SettingsPage = () => {
    const navigate = useNavigateWithTransition();

    return (
        <div className="page">
            <Header title="Settings" />

            <div className="content">
                <p>Settings content here...</p>

                {/* Navigate without transition (e.g., for tabs) */}
                <button onClick={() => navigate('/profile', { transition: false })}>
                    Go to Profile (no animation)
                </button>
            </div>
        </div>
    );
};
```

---

## API Reference

### `useNavigateWithTransition(config?)`

A wrapper around React Router's `useNavigate` that adds view transition support.

#### Config Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `platform` | `'ios' \| 'android' \| 'auto'` | `'auto'` | Animation style to use |
| `detectPlatform` | `() => 'ios' \| 'android' \| undefined` | - | Custom platform detector |

#### Navigate Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `transition` | `boolean` | `true` (or `false` if `replace: true`) | Enable/disable transition animation |
| `direction` | `'forward' \| 'back'` | auto | Animation direction (back animation for path navigation) |
| `animation` | `'slide' \| 'lift' \| 'fade' \| 'zoom' \| 'none'` | platform-based | Animation type (overrides platform default) |
| `replace` | `boolean` | `false` | Replace current history entry (disables transition by default) |
| `state` | `any` | - | State to pass to the new location |

#### Return Value

Returns a `Promise<void>` that resolves when the transition animation completes.

> **Note:** When `replace: true` is set, transitions are automatically disabled. This is ideal for tab bar navigation where you want instant switches. Use `transition: true` explicitly to override this behavior.

#### Examples

```tsx
// Auto-detect platform (default)
const navigate = useNavigateWithTransition();

// Force specific platform
const navigate = useNavigateWithTransition({ platform: 'ios' });
const navigate = useNavigateWithTransition({ platform: 'android' });

// Custom platform detector (e.g., for hybrid apps)
const navigate = useNavigateWithTransition({
    detectPlatform: () => {
        if (window.AndroidBridge) return 'android';
        if (window.webkit?.messageHandlers) return 'ios';
        return undefined; // Desktop: iOS-style default
    }
});

// Usage
navigate('/path');                                        // Forward with transition
navigate(-1);                                             // Back with transition
navigate('/home', { direction: 'back' });                 // Path with back animation
navigate('/path', { transition: false });                 // No transition
navigate('/path', { replace: true });                     // Replace history (no transition)
navigate('/path', { replace: true, transition: true });   // Replace with transition
navigate('/path', { state: { from: '/' } });              // With state

// Animation types
navigate('/modal', { animation: 'fade' });                // Crossfade (good for modals)
navigate('/gallery/1', { animation: 'zoom' });            // Scale with fade (galleries)
navigate('/page', { animation: 'slide' });                // Force iOS-style slide
navigate('/page', { animation: 'lift' });                 // Force Android-style lift
navigate('/reset', { animation: 'none' });                // Instant, no animation

// Await transition completion
await navigate('/settings');
console.log('Transition complete!');

// Chain with other actions
navigate('/checkout').then(() => {
    analytics.track('checkout_viewed');
});
```

### `useGoBack(config?)`

Convenience hook for back navigation with transition.

```tsx
import { useGoBack } from '@lemoncloud/react-page-transition';

const Header = () => {
    const goBack = useGoBack();

    // With custom platform
    const goBack = useGoBack({ platform: 'ios' });

    return <button onClick={goBack}>← Back</button>;
};
```

### `detectPlatform()`

Utility function to detect the current platform based on user agent.

```tsx
import { detectPlatform } from '@lemoncloud/react-page-transition';

const platform = detectPlatform();
// Returns: 'ios' | 'android' | undefined (desktop)

// Use for conditional rendering
if (platform === 'android') {
    // Show Android-specific UI
}
```

### Types

```tsx
import type {
    PlatformType,              // 'ios' | 'android'
    NavigationDirection,       // 'forward' | 'back'
    AnimationType,             // 'slide' | 'lift' | 'fade' | 'zoom' | 'none'
    PageTransitionConfig,      // { platform?, detectPlatform? }
    TransitionNavigateOptions, // NavigateOptions & { transition?, direction?, animation? }
    NavigateWithTransitionFn,  // (to, options?) => Promise<void>
    ViewTransition,            // View Transitions API type
    ViewTransitionCallback,    // Callback for startViewTransition
} from '@lemoncloud/react-page-transition';
```

---

## Animation Styles

### Slide (iOS default)

| Direction | Animation | Duration |
|-----------|-----------|----------|
| Forward → | New page slides in from right | 350ms |
| ← Back | Old page slides out to right | 350ms |

Easing: `cubic-bezier(0.32, 0.72, 0, 1)` (iOS native curve)

### Lift (Android default)

| Direction | Animation | Duration |
|-----------|-----------|----------|
| Forward → | New page lifts up with fade in | 100ms |
| ← Back | Old page lifts down with fade out | 100ms |

Easing: `ease-out`

### Fade

Simple crossfade animation. Good for modals, auth flows, overlays.

| Direction | Animation | Duration |
|-----------|-----------|----------|
| Forward/Back | Crossfade | 200ms |

### Zoom

Scale with fade animation. Good for image galleries, detail views.

| Direction | Animation | Duration |
|-----------|-----------|----------|
| Forward → | Scale up from 0.9 with fade in | 250ms |
| ← Back | Scale down to 0.9 with fade out | 250ms |

### None

Instant switch with no animation. Good for deep links, resets.

---

## Customization

### Override Animation Duration

```css
/* Global override */
::view-transition-old(root),
::view-transition-new(root) {
    animation-duration: 400ms;
}

/* iOS only */
:not(.android)::view-transition-old(root),
:not(.android)::view-transition-new(root) {
    animation-duration: 400ms;
}

/* Android only */
.android::view-transition-old(root),
.android::view-transition-new(root) {
    animation-duration: 150ms;
}
```

### Override Animation Easing

```css
::view-transition-old(root),
::view-transition-new(root) {
    animation-timing-function: ease-in-out;
}
```

### Custom Animations

```css
/* Custom slide animation */
@keyframes my-slide-in {
    from { transform: translateX(100%) scale(0.95); opacity: 0; }
    to { transform: translateX(0) scale(1); opacity: 1; }
}

::view-transition-new(root) {
    animation-name: my-slide-in;
}
```

### Disable for Specific Elements

```css
/* Skip transition for modals */
.modal {
    view-transition-name: none;
}
```

---

## Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 111+ | ✅ Full |
| Edge | 111+ | ✅ Full |
| Safari | 18+ | ✅ Full |
| Firefox | - | ❌ Polyfill needed |
| Opera | 97+ | ✅ Full |

### Fallback Behavior

For unsupported browsers, the library gracefully falls back to instant navigation without animations. No errors, no broken UI.

```tsx
// This works on all browsers
navigate('/path'); // Animated on supported, instant on unsupported
```

---

## Troubleshooting

### Animations not working

1. **Check CSS import**: Make sure you imported the CSS file:
   ```tsx
   import '@lemoncloud/react-page-transition/styles.css';
   ```

2. **Check browser support**: View Transitions API requires Chrome 111+, Safari 18+, or Edge 111+

3. **Check for CSS conflicts**: Other CSS might be overriding the animations

### Flickering during transition

Add these styles to your root element:

```css
html {
    background-color: white; /* or your app's background color */
}
```

### Wrong animation direction

Use `navigate(-1)` or the `direction` option for back navigation:

```tsx
// ✅ Correct - triggers back animation
navigate(-1);

// ✅ Also correct - path with back animation
navigate('/home', { direction: 'back' });

// ❌ Wrong - triggers forward animation (unless direction specified)
navigate('/');
```

### TypeScript errors

Make sure you have the correct peer dependencies:

```bash
npm install react@^18 react-router-dom@^6
```

---

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/lemoncloud-io/react-page-transition.git
cd react-page-transition

# Install dependencies
pnpm install

# Start development
pnpm dev
```

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Watch mode for development |
| `pnpm build` | Build the library |
| `pnpm test` | Run tests in watch mode |
| `pnpm test:run` | Run tests once |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript type checking |

### Project Structure

```
src/
├── index.ts                 # Main entry point
├── types.ts                 # TypeScript types
├── constants.ts             # CSS class constants
├── hooks/
│   ├── index.ts
│   ├── useNavigateWithTransition.ts
│   ├── useNavigateWithTransition.test.tsx
│   └── useGoBack.ts
├── utils/
│   ├── index.ts
│   ├── platform.ts
│   └── platform.test.ts
├── styles/
│   └── page-transition.css  # Animation CSS
└── test/
    └── setup.ts             # Vitest setup
```

### Running the Example

```bash
# Run the basic example
pnpm --filter @example/basic dev

# Open http://localhost:3000
```

### Testing Locally

To test the package in another project before publishing:

```bash
# In this repo
pnpm build
pnpm pack
# Creates: lemoncloud-react-page-transition-0.0.1.tgz

# In your test project
npm install ../path/to/lemoncloud-react-page-transition-0.0.1.tgz
```

---

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) with [semantic-release](https://github.com/semantic-release/semantic-release) for automatic versioning:

| Commit Type | Version Bump | Example |
|-------------|--------------|---------|
| `feat:` | Patch | `feat: add new animation option` |
| `fix:` | Patch | `fix: resolve flickering issue` |
| `refactor:` | Patch | `refactor: improve performance` |
| `chore:` | Patch | `chore: update dependencies` |
| `feat(minor):` | Minor | `feat(minor): add new hook` |
| `feat(major):` | Major | `feat(major): restructure API` |
| `docs:` | No release | `docs: update README` |
| `test:` | No release | `test: add unit tests` |
| `ci:` | No release | `ci: update workflow` |
| `style:` | No release | `style: format code` |

---

## License

MIT © [LemonCloud](https://lemoncloud.io)

---

## Related

- [View Transitions API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
- [React Router](https://reactrouter.com/)
