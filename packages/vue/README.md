# @lemoncloud/vue-page-transition

iOS/Android style page transitions for Vue using the View Transitions API.

## Installation

```bash
npm install @lemoncloud/vue-page-transition
```

**Peer Dependencies:** `vue >= 3.0.0`, `vue-router >= 4.0.0`

## Quick Start

```ts
// main.ts
import '@lemoncloud/page-transition-core/styles.css';

// Component
import { useNavigateWithTransition } from '@lemoncloud/vue-page-transition';

const { navigate, goBack } = useNavigateWithTransition();

navigate('/settings');
goBack();
```

## API

### `useNavigateWithTransition(config?)`

```ts
const { navigate, goBack } = useNavigateWithTransition({
    platform: 'auto',  // 'ios' | 'android' | 'auto'
    detectPlatform: () => 'ios' | 'android' | undefined,  // Custom detector
});

// Usage
navigate('/path');
navigate('/path', { animation: 'fade' });
navigate(-1);  // or goBack()
```

### Navigate Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `transition` | `boolean` | `true` | Enable animation |
| `direction` | `'forward' \| 'back'` | auto | Animation direction |
| `animation` | `'slide' \| 'lift' \| 'fade' \| 'zoom' \| 'none'` | platform | Animation type |
| `replace` | `boolean` | `false` | Replace history |

## License

MIT © [LemonCloud](https://lemoncloud.io)
