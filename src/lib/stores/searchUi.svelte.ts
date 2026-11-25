/**
 * Open state of the Plus search modal, shared by the desktop Nav and the small-screen top bar
 * (ai-docs/implementation/mobile-web-shell.md, Phase 3).
 *
 * There must be exactly one `<Search>` instance (the one in `Nav.svelte`, which is always
 * mounted): it listens for Ctrl/Cmd+K on `window`, so a second instance would open a second
 * modal. `MobileTopBar` only sets `searchUi.open = true`; `Nav` binds the modal to it.
 */
export const searchUi = $state({ open: false });
