const SCROLLABLE_SELECTOR = '.panel';

function isInsideScrollable(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(SCROLLABLE_SELECTOR) !== null;
}

function cancel(event: TouchEvent): void {
  if (event.cancelable) {
    event.preventDefault();
  }
}

export function blockNativeGestures(surface: HTMLElement, signal: AbortSignal): void {
  const listenerOptions = { passive: false, signal };
  surface.addEventListener('touchstart', cancel, listenerOptions);
  surface.addEventListener('touchmove', cancel, listenerOptions);
  document.addEventListener(
    'touchmove',
    (event) => {
      if (!isInsideScrollable(event.target)) {
        cancel(event);
      }
    },
    listenerOptions,
  );
}
