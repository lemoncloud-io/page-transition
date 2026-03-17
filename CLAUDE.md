# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A React library providing iOS/Android style page transitions using the View Transitions API. Wraps React Router's `useNavigate` to add native-feeling animations with platform auto-detection.

## Development Commands

```bash
pnpm build              # Build library (tsup + CSS copy)
pnpm dev                # Watch mode development
pnpm test               # Run tests in watch mode (vitest)
pnpm test:run           # Run tests once
pnpm test:coverage      # Run with coverage
pnpm lint               # ESLint (src/**/*.ts,tsx)
pnpm typecheck          # TypeScript check (tsc --noEmit)
```

### Running the Example App

```bash
pnpm --filter @example/basic dev    # Starts at localhost:3000
```

## Architecture

### Core Flow

```
useNavigateWithTransition() → resolvePlatform() → document.startViewTransition()
                                                         ↓
                                              CSS classes added to <html>
                                              (.android, .back-navigation)
                                                         ↓
                                              CSS keyframes animate
                                              ::view-transition-* pseudo-elements
```

### Key Design Decisions

1. **CSS-driven animations**: Platform and direction classes are added to `document.documentElement`, letting pure CSS handle animation selection via `::view-transition-*` selectors

2. **Direction detection**: Back navigation is detected by checking if `to` parameter is a negative number (`navigate(-1)`)

3. **Replace behavior**: `replace: true` disables transitions by default (ideal for tab bars); override with explicit `transition: true`

4. **SSR safe**: All browser APIs (`navigator`, `document.startViewTransition`) are guarded with existence checks

### Source Structure

- `src/hooks/useNavigateWithTransition.ts` - Main hook that wraps React Router navigation with View Transitions API
- `src/hooks/useGoBack.ts` - Convenience wrapper for `navigate(-1)`
- `src/utils/platform.ts` - Platform detection from user agent
- `src/constants.ts` - CSS class names (`back-navigation`, `android`)
- `src/styles/page-transition.css` - Animation keyframes and view transition rules

### Animation Timings

| Platform | Duration | Easing |
|----------|----------|--------|
| iOS (default) | 350ms | `cubic-bezier(0.32, 0.72, 0, 1)` |
| Android | 100ms | `ease-out` |

## TypeScript Configuration

- Strict mode enabled with `noUncheckedIndexedAccess` and `noImplicitOverride`
- Tests excluded from main compilation (run separately via vitest)

## Commit Convention

Uses Conventional Commits with semantic-release:
- `feat:` → patch, `feat(minor):` → minor, `feat(major):` → major
- `fix:`, `refactor:`, `chore:` → patch
- `docs:`, `test:`, `ci:`, `style:` → no release
