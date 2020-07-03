import EventEmitter from './event-emitter';
import { distance } from './math';
import { composeEvents, htmlEvent } from './events';

type MixedPointerEvent = MouseEvent | TouchEvent;

export interface PointerEventsConstructorParams {
  target?: EventTarget,
  parent?: EventTarget,
  tapThreshold?: number;
  tapDelay?: number;
}

export interface PointerEvent {
  inside: boolean;
  pageX: number;
  pageY: number;
  clientX: number;
  clientY: number;
  screenX: number;
  screenY: number;
  target: EventTarget;
  type: string;
  event: MouseEvent | TouchEvent;
}

export interface PointerEventsTypes {
  move: PointerEvent;
  down: PointerEvent;
  up: PointerEvent;
  drag: PointerEvent;
  tap: PointerEvent;
}

export interface TypedEventEmitter<T> {
  on<K extends keyof T>(s: K, listener: (v:T[K]) => void);
  off<K extends keyof T>(s: K, listener: (v:T[K]) => void);
  emit: (key: string, event: any) => void;
  removeAllListeners<K extends keyof T>(s?: K);
  pause: () => void;
  resume: () => void;
}

export class PointerEvents extends (EventEmitter as { new(): TypedEventEmitter<PointerEventsTypes>}) {
  private target: EventTarget;
  private parent: EventTarget;
  private unbindEvents: Function;
  private tapThreshold: number;
  private tapDelay: number;
  private isDown: boolean;
  private lastPosition: number[];
  private startTime: number;

  constructor({
    target = window.document.body,
    parent = window,
    tapThreshold = 10,
    tapDelay = 450,
  }: PointerEventsConstructorParams) {
    super();
    this.target = target;
    this.parent = parent;
    this.tapThreshold = tapThreshold;
    this.tapDelay = tapDelay;
    this.isDown = false;
    this.lastPosition = [0, 0];
    this.startTime = 0;
    this.bind();
  }

  bind() {
    const { parent, target } = this;
    const capture = { passive: true };
    this.unbindEvents = composeEvents(
      htmlEvent(target, 'touchstart', this.onStart, capture),
      htmlEvent(target, 'mousedown', this.onStart, capture),
      htmlEvent(parent, 'mousemove', this.onMove, capture),
      htmlEvent(parent, 'touchmove', this.onMove, capture),
      htmlEvent(parent, 'touchcancel', this.onEnd, capture),
      htmlEvent(parent, 'mouseup', this.onEnd, capture),
      htmlEvent(parent, 'touchend', this.onEnd, capture),
    );
  }

  unbind() {
    this.unbindEvents();
  }

  private isTouchEvent(event: any) {
    return event instanceof TouchEvent;
  }

  private normalizeEvent(event: any) {
    if (this.isTouchEvent(event)) {
      event = event.touches[0] || event.changedTouches[0];
    }
    return {
      inside: event.target === this.target,
      pageX: event.pageX,
      pageY: event.pageY,
      clientX: event.clientX,
      clientY: event.clientY,
      screenX: event.screenX,
      screenY: event.screenY,
      target: event.target,
      type: event.type || 'touch',
      event,
    } as PointerEvent;
  }

  private onStart = (event: MixedPointerEvent) => {
    if (this.isDown) return;
    const nEvent = this.normalizeEvent(event);
    this.lastPosition = [nEvent.clientX, nEvent.clientY];
    this.startTime = performance.now();
    this.isDown = true;
    this.emit('down', nEvent);
  }

  private onMove = (event: MixedPointerEvent) => {
    const nEvent = this.normalizeEvent(event);
    if (nEvent.inside) {
      this.emit('move', nEvent);
    }
    if (this.isDown) {
      this.emit('drag', nEvent);
    }
  }

  private onEnd = (event: MixedPointerEvent) => {
    const { lastPosition, startTime, tapThreshold, tapDelay} = this;
    const nEvent = this.normalizeEvent(event);
    const pos = [nEvent.clientX, nEvent.clientY];
    const dst = distance(pos, lastPosition);
    const elapsedTime = performance.now() - startTime;
    if (this.isDown) {
      this.emit('up', nEvent);
    }
    if (nEvent.inside && Math.abs(dst) < tapThreshold && elapsedTime < tapDelay) {
      this.emit('tap', nEvent);
    }
    this.isDown = false;
  }
}