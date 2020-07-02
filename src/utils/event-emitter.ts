export default class EventEmitter {
  private paused: boolean;
  private types: Map<string, Set<Function>>;

  constructor() {
    this.paused = true;
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  on(type: string, handler: Function) {
    this.types = this.types || new Map();
    if (!this.types.has(type)) {
      this.types.set(type, new Set());
    }
    this.types.get(type).add(handler);
    this.paused = false;
  }

  off(type: string, handler: Function) {
    const handlers = this.types.get(type);
    handlers.delete(handler);
  }

  emit(type: string, event: any) {
    if (this.paused) return false;
    const handlers = this.types.get(type);
    if (handlers) {
      for (let handler of handlers) {
        handler(event);
      }
    }
  }
}