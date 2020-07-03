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
    const { types } = this;
    if (!types || !types.has(type)) return;
    const handlers = types.get(type);
    handlers.delete(handler);
  }

  emit(type: string, event: any) {
    const { types } = this;
    if (!types || !types.has(type) || this.paused) return;
    const handlers = types.get(type);
    for (let handler of handlers) {
      handler(event);
    }
  }

  removeAllListeners(type?: string) {
    const { types } = this;
    if (!types) return;
    if (!type) {
      types.forEach(handlers => handlers.clear());
      return;
    }
    if (!types.has(type)) return;
    const handlers = this.types.get(type);
    handlers.clear();
  }
}