# Plan — ordinal-keyed scroll restoration

Fixes the two defects that make back-navigation scroll restoration a no-op in
every real router, plus the four documentation items raised in
`docs/known-issues-from-muzly-adoption.md`.

Target version: **1.4.0** (minor — one new public option, no breaking change).

---

## Background — the two defects

### A. The restore lookup is off by one history entry

`handleBackScroll` (`packages/core/src/transition.ts:124`) runs inside the
View Transitions callback and calls `popScrollPosition()`, which resolves its
key through `currentKey()` (`packages/core/src/scroll.ts:46`) — i.e.
`window.history.state`, read *at restore time*.

| Step | `history.state` at that moment | Store operation |
|---|---|---|
| Forward A → B (`transition.ts:191`, before `startViewTransition`) | `A` | `save[A] = A.scrollTop` |
| Back B → A (`transition.ts:216`, inside the callback) | still `B` | `restore(B)` → miss |

`history.go(-1)` is asynchronous: the browser dispatches `popstate` on a later
task. The React wrapper's `navigationFn` awaits only `Promise.resolve()`
(`packages/react/src/useNavigateWithTransition.ts:93`), one microtask, so
`history.state` has not settled when the key is read. The lookup asks for the
entry being *left* and needs the *destination*.

Measured in `muzly-app` by instrumenting `document.startViewTransition`:

```
stateAfterNav: {"key":"v4m7m90r","idx":1}   // the departing entry
```

### B. `currentKey()` does not support vue-router at all

`scroll.ts:8` claims:

> keys entries by `history.state.key` (react-router / vue-router both populate it)

This is false. vue-router 4.6.4 `buildState`
(`node_modules/.../vue-router/dist/vue-router.mjs:91-99`) writes:

```js
{ back, current, forward, replaced, position, scroll }
```

No `key`, no `idx`. Every Vue consumer therefore falls through to the last
branch of `currentKey()`:

```ts
`${window.location.href}#${window.history.length}`
```

`history.length` grows with each push, so an entry saved at length 2 is looked
up at length 3 and **misses even when the timing is correct**. Same-URL entries
also collide. This is a second, independent failure path that defect A masks.

vue-router's `position` is the direct analogue of react-router's `idx`: a push
sets `position: currentState.position + 1` (`vue-router.mjs:145`), a replace
preserves it (`vue-router.mjs:135`). Adjacent entries differ by exactly 1 in
both routers.

---

## Decisions

| # | Decision | Rationale |
|---|---|---|
| 1 | **Ordinal-keyed lookup in core**, not a caller-supplied `scrollKey` | The doc's Option 1 assumed the caller knows the destination key; for `navigate(-1)` `useLocation().key` is the *departing* entry, so every consumer would have to maintain its own `idx → key` map — the exact bookkeeping the library is failing to do. An ordinal read from `history.state` needs no wait and no caller burden, and fixes defect B in the same change. |
| 2 | **No `popstate` await** | It would live in the wrappers, leaving the documented framework-agnostic entry `executePageTransition` broken, and it settles `history.state` without guaranteeing the router has committed. |
| 3 | **`delta` as a public option** | Ordinal arithmetic needs the hop count. A public option also makes `go(-2)` work and keeps core-direct callers whole. |
| 4 | **`restore()` no longer deletes; a separate `discard(key)` owns error rollback** | `consumeScrollEntry` (`transition.ts:194-199`) depends on the current delete-on-read to undo its own `save()`, so the delete cannot simply be removed. Splitting the two lets an entry survive a back → browser-forward → back cycle, matching native scroll restoration; `DEFAULT_MAX_ENTRIES = 50` LRU owns the lifetime. `discard` takes the key `save()` returned rather than re-resolving `currentKey()` — see the note below. |
| 5 | **Deprecated public API frozen** | `pushScrollPosition` / `popScrollPosition` / `clearScrollStack` keep their exact signatures and behaviour (delta 0, delete-on-read). New behaviour goes to non-exported internals, so the v2.0 removal plan is untouched and no consumer breaks. |
| 6 | **Regression tests mutate `history.state` between forward and back** | `transition.test.ts:167` pins the state once in `beforeEach`, which is why this class of bug is structurally uncatchable today. `MemoryRouter` was rejected specifically: it keeps an in-memory stack and never updates `window.history.state`, so `currentOrdinal()` would read `null` and the test would exercise only the fallback path. (`BrowserRouter` under jsdom *does* drive `window.history`, so integration testing is possible — it is simply not worth the setup here, where unit tests catch the bug directly.) |
| 7 | **All four documentation items in one commit** | Doc Sync rule — docs move with the code that invalidates them. |

### Refinement to decision 3 (deviates from the sketch approved in chat)

The sketch had the wrappers pass `delta: typeof to === 'number' ? to : undefined`
with core defaulting to `-1` for `direction: 'back'`. That misfires on
`navigate('/home', { direction: 'back' })` — a *push* with a back animation.
There, an omitted delta would resolve to `-1` and restore the scroll offset of
the entry preceding the current one onto a brand-new page.

The wrappers therefore pass an explicit `0` in that case:

```ts
delta: typeof to === 'number' ? to : 0,
```

Core keeps `options?.delta ?? (isBack ? -1 : 0)`, so the `-1` default now only
applies to direct `executePageTransition` callers that pass `direction: 'back'`
without a delta — which is the useful default for a hand-rolled `history.back()`.

---

## Implementation

### Step 1 — `packages/core/src/scroll.ts`

Entry model gains an ordinal index alongside the existing key map.

```ts
interface StoredEntry {
    pos: ScrollPosition;
    ordinal: number | null;
}

/** react-router writes `idx`; vue-router writes `position`. Same semantics. */
const currentOrdinal = (): number | null => {
    if (typeof window === 'undefined') return null;
    const state = window.history.state as { idx?: unknown; position?: unknown } | null;
    if (typeof state?.idx === 'number') return state.idx;
    if (typeof state?.position === 'number') return state.position;
    return null;
};
```

Store internals:

```ts
const positions = new Map<string, StoredEntry>();
const byOrdinal = new Map<number, string>();   // ordinal -> key
```

- `save(pos): string` — writes `positions[key]` (delete-then-set to refresh LRU
  order) and, when `currentOrdinal()` is non-null, `byOrdinal[ordinal] = key`.
  **Returns the key it wrote**, so the caller can roll back exactly that record.
- `resolveKey(delta): string | undefined` — when `delta === 0`, returns
  `currentKey()`. When `delta !== 0`, requires an ordinal: returns
  `byOrdinal.get(currentOrdinal() + delta)`, or `undefined` when
  `currentOrdinal()` is `null`. It must **not** fall back to `currentKey()` for
  a non-zero delta — that would hand back the departing entry's own offset and
  reproduce the stale-restore misfire that decision 3's refinement exists to
  prevent.
- `restore(delta, { consume })` — resolves the key, returns the position (or
  `undefined` when the key does not resolve), deletes only when `consume` is
  true.
- `discard(key)` — removes `positions[key]` and its `byOrdinal` mapping. Takes
  the key rather than re-resolving `currentKey()`: `consumeScrollEntry` is
  reached both from the `catch` around `startViewTransition` *and* from inside
  the callback after `runNavigation` throws, and in the second case the router
  may already have committed (react-router's `push` calls `pushState`
  synchronously). Re-resolving there would delete the wrong record and leave the
  saved one to rot until LRU eviction.
- `evictIfFull()` — when dropping the oldest key, also drop its `byOrdinal`
  mapping if it still points at that key.

New non-exported internals used by `transition.ts`
(`saveScrollPosition`, `peekScrollPosition`, `discardScrollPosition`) plus the
existing `__defaultScrollStoreForTest` handle. The three deprecated exports
become thin wrappers preserving today's semantics:

```ts
export const popScrollPosition = (): ScrollPosition | undefined =>
    defaultStore.restore(0, { consume: true });
```

Also rewrite the file header comment (see Step 5).

### Step 2 — `packages/core/src/types.ts`

```ts
/**
 * How many history entries this navigation moves, as passed to
 * `history.go()` — e.g. `-1` for a single step back, `-2` for two.
 * Used to locate the destination entry's saved scroll offset, since
 * `history.state` has not settled while the transition callback runs.
 *
 * Defaults to `-1` when `direction` is `'back'`, `0` otherwise. Pass `0`
 * explicitly for a push navigation that merely *animates* as a back
 * navigation (`direction: 'back'` on a path), so no stale offset is
 * restored.
 */
delta?: number;
```

### Step 3 — `packages/core/src/transition.ts`

```ts
const handleBackScroll = (root: Element | null, delta: number): void => {
    const saved = peekScrollPosition(delta);
    if (saved) applyScrollPosition(saved, root);
};
```

- `const delta = options?.delta ?? (isBack ? -1 : 0);`
- forward push switches to `savedKey = saveScrollPosition(scrollRoot)`, captured
  in the enclosing scope
- `handleBackScroll(scrollRoot, delta)` at `transition.ts:216`
- `consumeScrollEntry` calls `discardScrollPosition(savedKey)` instead of
  `popScrollPosition()`

### Step 4 — wrappers

`packages/react/src/types.ts` and `packages/vue/src/types.ts`: add `delta?: number`
with a short JSDoc pointing at the core option.

`packages/react/src/useNavigateWithTransition.ts` — destructure `delta` from
options, then:

```ts
return executePageTransition(navigationFn, {
    ...,
    delta: delta ?? (typeof to === 'number' ? to : 0),
});
```

`packages/vue/src/useNavigateWithTransition.ts` — identical addition.

`packages/react/src/useGoBack.ts` `GoBackOptions` and the Vue `goBack` `Pick<>`
both widen to include `'delta'` (so `goBack({ delta: -2 })` is expressible
alongside `navigate(-2)`).

### Step 5 — documentation

1. `packages/core/src/scroll.ts` header — replace the false claim with the
   actual resolution order: explicit ordinal (`history.state.idx` for
   react-router, `history.state.position` for vue-router) → `history.state.key`
   → URL + `history.length` fallback, and note that the fallback cannot survive
   a push because `history.length` changes.
2. `docs/scrolling-and-view-transitions.md` — `## Proposed library fix` (line
   119) becomes `## Using scrollRoot`, describing the shipped option; the TL;DR
   (line 7) drops "the library hard-codes `window.scroll*`"; the consumer
   checklist (line 165) gains a paragraph on the **unmount** flash (keep the
   shell route mounted, swap only `<Outlet>` content, hide chrome with CSS) that
   states plainly that `epyt-app`'s note records this as only a *partial* fix —
   the WKWebView snapshot limit remains.
3. `README.md` `## API` (line 102) — one line that `replace: true` disables the
   transition by default and `transition: true` overrides it, plus the `delta`
   option.
4. `docs/known-issues-from-muzly-adoption.md` — correct the `scroll.ts:71-76`
   citation (actual range is 71-77) and, **once the fix lands in this same
   commit**, mark issues 1–5 resolved with a pointer to this plan. Nothing here
   is marked resolved ahead of the code.

### Step 6 — changeset

`.changeset/scroll-restore-ordinal.md`, **minor** for all three linked packages.

---

## Test specification

### `packages/core/src/scroll.test.ts`

Parameterise the router state shape so both are covered:

```ts
describe.each([
    ['react-router', (n: number) => ({ key: `k${n}`, idx: n })],
    ['vue-router',   (n: number) => ({ current: `/p${n}`, position: n })],
])('ordinal lookup — %s', (_name, stateAt) => { ... });
```

Cases:
1. save at ordinal 0, move to ordinal 1, `restore(-1)` returns the ordinal-0
   position — the core regression, red before the fix in both shapes.
2. `restore(-2)` after three entries resolves two hops back.
3. `restore(0)` still resolves via `currentKey()`.
4. Fallback: state with neither `idx` nor `position` → `restore(-1)` returns
   `undefined` rather than a wrong entry.
5. `restore` does not consume — two consecutive `restore(-1)` calls both hit.
6. `discard()` removes the current entry; a subsequent `restore(0)` misses.
7. Eviction past 50 entries drops the stale `byOrdinal` mapping (no resurrection
   of an evicted key).
8. `popScrollPosition()` unchanged: delta 0, still deletes on read.

### `packages/core/src/transition.test.ts`

Replace `restores the saved container offset on back navigation` (line 215):

```ts
it('restores across a real history entry change', async () => {
    const el = makeContainer(275);
    window.history.replaceState({ key: 'A', idx: 0 }, '', '/a');
    await executePageTransition(() => undefined, { direction: 'forward', scrollRoot: el });

    window.history.replaceState({ key: 'B', idx: 1 }, '', '/b');   // ← missing today
    (el.scrollTo as Mock).mockClear();

    await executePageTransition(() => undefined, { direction: 'back', delta: -1, scrollRoot: el });
    expect(el.scrollTo).toHaveBeenCalledWith(0, 275);
});
```

Plus:
- `direction: 'back'` with `delta: 0` on a push does **not** restore a stale
  offset (guards the decision-3 refinement).
- Error thrown inside `navigationFn` discards the entry it saved: a following
  forward transition finds no leftover.

### `packages/react/src/useNavigateWithTransition.test.tsx` and the Vue equivalent

- `navigate(-1)` forwards `delta: -1`; `navigate(-2)` forwards `-2`.
- `navigate('/home', { direction: 'back' })` forwards `delta: 0`.
- `goBack({ delta: -2 })` reaches core intact.

Gate: `pnpm typecheck && pnpm -r test && pnpm build`.

---

## Rollback

Every change is additive. Reverting the single commit restores 1.3.0 behaviour;
no stored data, config, or consumer call site changes shape. The `delta` option
is optional, so a consumer pinned to 1.4.0 that never passes it behaves exactly
as the wrappers drive it.

---

## Open / unverified

- **Snapshot timing on back navigations** (미검증). The known-issues doc notes
  that if `history.state` has not settled, react-router has not committed the
  destination route either, so the View Transitions "new" snapshot may be
  captured against the old DOM. No measurement exists, and `muzly-app` shipped
  with only a scroll workaround, which suggests back animations are not visibly
  wrong. Out of scope here; this plan does not change that timing.
- **Ordinal absent** — routers that write neither `idx` nor `position`, and
  hand-rolled `history.pushState` callers, get no back restoration at all: a
  non-zero delta with no ordinal resolves to `undefined` by design, since the
  URL + `history.length` fallback would return the departing entry. Forward
  reset-to-top still works. `scrollKey` as a caller-supplied escape hatch was
  considered and deferred; revisit if a consumer hits it.
- `epyt-app`'s partial-fix note on the unmount flash is second-hand from
  `docs/known-issues-from-muzly-adoption.md` (미검증 against that repo).

---

## Outcome

**Status: implemented on `fix/scroll-restore-ordinal`.** Verify green —
`pnpm typecheck` (3/3 packages), `pnpm test:run` (101 tests, 9 files, up from
79), `pnpm lint` (clean), `pnpm build`. `packages/core/dist/index.d.ts` contains
none of the three new internals, so the public API surface is unchanged as the
changeset claims.

### Second refinement to decision 3, found in review

The wrappers first derived the delta from `typeof to === 'number' ? to : 0`,
which guards a *path* push but not a positive numeric hop.
`navigate(1, { direction: 'back' })` — an already-tested case — would have sent
`delta: 1`, and the core would have restored `ordinal + 1`: the offset of a page
*ahead* of the destination, applied to a back-animated navigation. The delta now
comes from `typeof to === 'number' && to < 0 ? to : 0`, so only a backward hop
names an entry that can have a saved offset. Covered by
`history-delta.test.tsx` ("forwards 0 for a forward hop that only animates as
back"), which was red before the fix.

The error-rollback path was verified rather than assumed: making
`discardScrollPosition` a no-op turns all three error-balance tests red,
including the two that predate this change.

Files changed, all inside the planned scope:

```
packages/core/src/scroll.ts            ordinal index, peek/discard split
packages/core/src/types.ts             delta option
packages/core/src/transition.ts        delta plumbing, discard-by-key
packages/core/src/scroll.test.ts       +13 tests (react/vue shapes, eviction, frozen API)
packages/core/src/transition.test.ts   back-restore regression across a real entry change
packages/react/src/{types,useNavigateWithTransition,useGoBack}.ts
packages/react/src/history-delta.test.tsx   +5 tests
packages/vue/src/{types,useNavigateWithTransition}.ts
README.md · docs/scrolling-and-view-transitions.md · docs/known-issues-from-muzly-adoption.md
.changeset/scroll-restore-ordinal.md   minor
```

### Deviations from the plan

- **Seams.** The plan had no `## Seams` section; the seams were taken from its
  own approved test specification — `executePageTransition` for core behaviour,
  the `scroll.ts` module boundary for store mechanics (the internals are exported
  from the module but deliberately absent from `packages/core/src/index.ts`, so
  the package's public API is unchanged), and the wrapper hooks for option
  forwarding. No new seam was introduced.
- **"Non-exported internals"** in Step 1 was imprecise: `transition.ts` is a
  different module, so `saveScrollPosition` / `peekScrollPosition` /
  `discardScrollPosition` must be exported from `scroll.ts`. They are kept off the
  barrel instead, which is what the decision actually protects.
- **Rebuild required for typecheck.** `packages/react` resolves core types from
  `packages/core/dist`, so `pnpm typecheck` fails against a stale build until
  `pnpm build` runs. Not a code issue, but it is the order the gate needs.

### Not done

- **Vue wrapper tests.** `packages/vue` has no test file and no Vue test
  dependencies (`vue`, `@vue/test-utils` are absent from the root devDependencies;
  `vue` is a peer dependency of the package). Standing up that infrastructure is a
  larger change than this fix and would land untested-by-default. The Vue wrapper's
  delta forwarding is line-for-line identical to React's, which is covered by
  `history-delta.test.tsx`, and vue-router's `position` shape is covered directly
  in `scroll.test.ts`. The gap is pre-existing — no Vue code in this repo has ever
  had a test — and is called out here rather than silently accepted.

  That parity argument is weaker than it reads, and review made it weaker still:
  the positive-hop delta bug found in review existed **identically in both
  wrappers**, and only the React test caught it. The Vue wrapper's correctness
  therefore rests on hand-maintained parity with an untested twin, not on a test
  of its own. A future edit that diverges the two will fail nothing.

### Review gate

Three passes. Iteration 1 found the `docs/scrolling-and-view-transitions.md`
"Why it happens" section still describing 1.3.0 internals; iteration 2 found the
same class of drift in the wrapper `delta` JSDoc and the changeset, which
described the derivation as it stood *before* the positive-hop fix. Both fixed.
Iteration 3: **PASS** — Axis A 9/10 (one [Nice-to-have]: `core/types.ts:103-106`
names one of the two cases that need an explicit `0`), Axis B clean, deterministic
checks green.

### Cleanup pass (`/simplify`)

The store's two synchronized maps collapsed into one. The ordinal is now the
entry's **key** (`ord:<n>`) rather than a parallel index, so `keysByOrdinal`,
`StoredEntry`, and the `forgetOrdinal` sync helper are gone, and eviction is
back to a plain LRU delete. The "an evicted key resurrects its ordinal" bug
class the eviction test guards against is now structurally impossible rather
than merely guarded. `transition.ts` lost the `scrollEntryConsumed` flag and the
`consumeScrollEntry` closure — `discard(key)` is idempotent and the two rollback
sites are mutually exclusive, so the guard was dead weight.

Also: `pushScrollPosition` now delegates to `saveScrollPosition` instead of
duplicating its body, both test files share one container helper, the three
back-transition tests share one setup helper, and the `delta` rationale lives in
core's JSDoc with one-line pointers from the adapters instead of four verbatim
copies. Diff went from +505/-106 to +478/-132.

**Skipped, with reasons:**
- *Extract the adapters' shared `resolvedDelta` expression into core.* Both
  adapters resolve core through `dist/index`, not source (verified: `pnpm
  typecheck` fails against a stale `dist` until `pnpm build` runs). Sharing it
  means promoting it to core's **public** API to deduplicate one expression —
  a worse trade than the duplication.
- *Hoist the ordinal read out of the `startViewTransition` callback.* The fix
  needs a hoisted path for `delta !== 0` plus an in-callback path for
  `delta === 0` (whose key resolves to a different entry before and after the
  navigation), which adds a branch to save one property read — unmeasured. Its
  stronger justification is timing determinism, which is a correctness question,
  not a cleanup one.
- *Drop the `consume` axis from `restore`.* Load-bearing for the frozen
  deprecated `popScrollPosition`; it goes at v2.0 with that API.
