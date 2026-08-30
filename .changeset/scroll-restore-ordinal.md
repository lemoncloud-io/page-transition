---
'@lemoncloud/page-transition-core': minor
'@lemoncloud/react-page-transition': minor
'@lemoncloud/vue-page-transition': minor
---

Fix back-navigation scroll restoration, which never fired in a real router.

The restore looked the destination entry up by `history.state.key`, read inside
the View Transitions callback. `history.go(-1)` is asynchronous, so at that
moment the state still describes the entry being *left* — the lookup was off by
one entry in every direction and always missed. Vue apps missed for a second
reason: vue-router populates neither `key` nor `idx`, so every lookup fell
through to a URL + `history.length` fallback that changes as entries are pushed.

The destination is now identified by its ordinal (`history.state.idx` for
react-router, `history.state.position` for vue-router) offset by the hop count,
exposed as the new `TransitionOptions.delta`. The React and Vue wrappers derive
it from a backward numeric `to`, and pass `0` for a path navigation or a forward
hop — neither names an entry that can already hold a saved offset, so a
navigation that merely *animates* as a back navigation cannot pull a stale offset
onto the new page.

Restoring an entry no longer consumes it, so a back → browser-forward → back
cycle restores both times, matching native scroll restoration. Error rollback
now discards by the key it saved rather than re-reading the current entry, which
may already have advanced.

`pushScrollPosition`, `popScrollPosition`, and `clearScrollStack` keep their
existing signatures and behaviour.
