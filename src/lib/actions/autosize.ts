import type { Action } from 'svelte/action';

/**
 * Makes a <textarea> grow with its content so long answers stay fully visible.
 *
 * Usage: <textarea use:autosize={value} />
 *
 * The height is recalculated
 * - when the user types (input event),
 * - when the bound value changes programmatically, e.g. reset on a new question
 *   (the action parameter changes), and
 * - when the textarea's width changes (device rotation, window resize), because the
 *   text can then wrap onto more or fewer lines without any input event.
 */
export const autosize: Action<HTMLTextAreaElement, string | undefined> = (node) => {
  function resize() {
    node.style.height = 'auto';
    node.style.height = `${node.scrollHeight}px`;
  }

  let lastWidth = 0;
  // Setting the height also fires the observer, so only react to width changes.
  const observer = new ResizeObserver(() => {
    const width = node.clientWidth;
    if (width === lastWidth) return;
    lastWidth = width;
    resize();
  });

  node.addEventListener('input', resize);
  observer.observe(node);
  resize();

  return {
    // Parameter changed: wait a microtask so the new value is already in the DOM.
    update() {
      queueMicrotask(resize);
    },
    destroy() {
      node.removeEventListener('input', resize);
      observer.disconnect();
    }
  };
};
