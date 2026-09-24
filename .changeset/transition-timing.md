---
'@lemoncloud/page-transition-core': minor
'@lemoncloud/react-page-transition': minor
'@lemoncloud/vue-page-transition': minor
---

Add `onTiming` to measure a transition.

Pass `onTiming` to `executePageTransition` (or the React / Vue navigate and
goBack helpers) to receive phase durations once an animated transition
settles: `capture`, `update` (navigation + new page render), `start` and
`animation`, plus the frame count and longest frame gap during the animation,
and an `outcome` of `'finished'`, `'skipped'` or `'error'`. A long `update`
points at the freeze between tap and motion; a large `maxFrameGap` points at
main-thread jank during it.

Opt-in: only while `onTiming` is set does the library count frames and leave
`pt:*` measures on the performance timeline.
