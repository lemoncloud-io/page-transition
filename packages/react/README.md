# @lemoncloud/react-page-transition

iOS/Android style page transitions for React using the View Transitions API.

## Installation

```bash
npm install @lemoncloud/react-page-transition
```

**Peer Dependencies:** `react >= 18.0.0`, `react-router-dom >= 6.0.0`

## Quick Start

```tsx
// main.tsx
import '@lemoncloud/react-page-transition/styles.css';

// Component
import { useNavigateWithTransition } from '@lemoncloud/react-page-transition';

const MyComponent = () => {
    const navigate = useNavigateWithTransition();

    return (
        <>
            <button onClick={() => navigate('/settings')}>Settings</button>
            <button onClick={() => navigate(-1)}>Back</button>
        </>
    );
};
```

## API

### `useNavigateWithTransition(config?)`

```ts
const navigate = useNavigateWithTransition({
    platform: 'auto',  // 'ios' | 'android' | 'auto'
    detectPlatform: () => 'ios' | 'android' | undefined,  // Custom detector
});

// Usage
navigate('/path');
navigate('/path', { animation: 'fade' });
navigate(-1);  // Back with animation
```

### Navigate Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `transition` | `boolean` | `true` | Enable animation |
| `direction` | `'forward' \| 'back'` | auto | Animation direction |
| `animation` | `'slide' \| 'lift' \| 'fade' \| 'zoom' \| 'none'` | platform | Animation type |
| `replace` | `boolean` | `false` | Replace history |

### `useGoBack(config?)`

```ts
import { useGoBack } from '@lemoncloud/react-page-transition';

const goBack = useGoBack();
<button onClick={goBack}>Back</button>
```

## License

MIT © [LemonCloud](https://lemoncloud.io)
