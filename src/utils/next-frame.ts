let listeners: Function[] = [];
let scheduled = false;

function tick() {
  if (!scheduled) return;
  const calls = listeners.slice();
  scheduled = false;
  listeners = [];
  for (let i = 0; i < calls.length; i++) {
    calls[i]();
  }
}

function schedule() {
  if (!scheduled) {
    scheduled = true;
    requestAnimationFrame(tick);
  }
}

export function nextFrame(callback: Function) {
  if (!listeners.includes(callback)) {
    listeners.push(callback);
  }
  schedule();
}