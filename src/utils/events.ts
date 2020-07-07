/**
 * Adds an event listener on target and returns the function to unbind it.
 */
export function htmlEvent(
  target: EventTarget,
  type: string,
  callback: EventListenerOrEventListenerObject,
  options?: AddEventListenerOptions
) {
  target.addEventListener(type, callback, options);
  return () => {
    target.removeEventListener(type, callback);
  }
}

export function composeEvents(...handlers: Function[]) {
  return () => {
    if (! Array.isArray(handlers)) return;
    handlers.forEach(h => h());
  }
}
