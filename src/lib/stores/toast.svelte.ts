/**
 * toast.svelte.ts
 *
 * Minimal shared toast state. Any component can call:
 *   toast.show('Saved')          // success (default)
 *   toast.show('Saved', 'error') // error variant
 *   toast.hide()                 // dismiss early
 *
 * The Toast.svelte component in +layout.svelte reads this state reactively.
 */

type ToastVariant = 'success' | 'error';

interface ToastState {
  visible: boolean;
  message: string;
  variant: ToastVariant;
}

let _timer: ReturnType<typeof setTimeout> | null = null;

const state = $state<ToastState>({
  visible: false,
  message: '',
  variant: 'success'
});

function show(message: string, variant: ToastVariant = 'success', duration = 2000) {
  if (_timer) clearTimeout(_timer);
  state.message = message;
  state.variant = variant;
  state.visible = true;
  _timer = setTimeout(() => {
    state.visible = false;
    _timer = null;
  }, duration);
}

function hide() {
  if (_timer) {
    clearTimeout(_timer);
    _timer = null;
  }
  state.visible = false;
}

export const toast = { state, show, hide };
