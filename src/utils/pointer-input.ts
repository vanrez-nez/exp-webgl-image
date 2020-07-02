import EventEmitter from './event-emitter';
import { mapToRange, toDegrees } from './math';
import { PointerEvent } from './pointer-events';
import PointerEvents from './pointer-events';

type PointArray = [number, number];
type RangeArray = [number, number];
type SwipeDirection = 'vertical' | 'horizontal';

export interface PointerInputOptions {
  normalize?: boolean;
  remapX?: RangeArray;
  remapY?: RangeArray;
  swipeDirection?: SwipeDirection;
  swipeAngleThreshold?: number;
  swipeDistanceThreshold?: number;
}

export interface PointerInputEvent {
  event: PointerEvent,
  x: number,
  y: number,
  normalPosition: PointArray,
  pixelPosition: PointArray,
}

export default class PointerInput extends EventEmitter {
  private target: HTMLElement;
  private input: PointerEvents;
  private pixelPosition: PointArray;
  private normalPosition: PointArray;
  private normalize: boolean;
  private remapX: RangeArray;
  private remapY: RangeArray;
  private swipeDirection: SwipeDirection;
  private swipeAngleThreshold: number;
  private swipeDistanceThreshold: number;
  private swipeStart: PointArray;
  private locked: boolean;

  constructor(target: HTMLElement, {
    normalize = false,
    remapX = [0, 1] as RangeArray,
    remapY = [0, 1] as RangeArray,
    swipeDirection = 'horizontal',
    swipeAngleThreshold = 45,
    swipeDistanceThreshold = 10,
  }: PointerInputOptions) {
    super();
    this.normalize = normalize;
    this.remapX = remapX;
    this.remapY = remapY;
    this.swipeDirection = swipeDirection;
    this.swipeAngleThreshold = swipeAngleThreshold;
    this.swipeDistanceThreshold = swipeDistanceThreshold;
    this.target = target;
    this.pixelPosition = [0, 0];
    this.normalPosition = [0, 0];
    this.swipeStart = [0, 0];
    this.locked = false;
    this.input = new PointerEvents({ target });
    this.input.on('move', this.onMove);
    this.input.on('tap', this.onTap);
    this.input.on('down', this.onDown);
    this.input.on('up', this.onUp);
    this.input.on('drag', this.onDrag);
  }

  private updatePosition(event: PointerEvent) {
    const { remapX, remapY, target, normalPosition, pixelPosition } = this;
    const { width, height, left, top } = target.getBoundingClientRect();
    let x = event.clientX - left;
    let y = event.clientY - top;
    let nX = x / width;
    let nY = y / height;
    nX = mapToRange(nX, 0, 1, remapX[0], remapX[1]);
    nY = mapToRange(nY, 0, 1, remapY[0], remapY[1]);
    normalPosition[0] = nX;
    normalPosition[1] = nY;
    pixelPosition[0] = x;
    pixelPosition[1] = y;
  }

  private wrapEvent(e: PointerEvent) {
    const {x, y, pixelPosition, normalPosition } = this;
    return {
      event: e,
      pixelPosition,
      normalPosition,
      x,
      y,
    } as PointerInputEvent
  }

  private onMove = (e: PointerEvent) => {
    this.updatePosition(e);
    this.emit('move', this.wrapEvent(e));
  }

  private onDrag = (e: PointerEvent) => {
    this.updatePosition(e);
    this.emit('drag', this.wrapEvent(e));
  }

  private onTap = (e: PointerEvent) => {
    this.updatePosition(e);
    this.emit('tap', this.wrapEvent(e));
  }

  private onDown = (e: PointerEvent) => {
    const { swipeStart, pixelPosition } = this;
    this.updatePosition(e);
    this.emit('down', this.wrapEvent(e));
    this.locked = true;
    swipeStart[0] = pixelPosition[0];
    swipeStart[1] = pixelPosition[1];
  }

  private getSwipe() {
    const { target, swipeDirection, swipeAngleThreshold, swipeDistanceThreshold } = this;
    const { width, height } = target.getBoundingClientRect();
    const dx = this.pixelPosition[0] - this.swipeStart[0];
    const dy = this.pixelPosition[1] - this.swipeStart[1];
    const dist = Math.hypot(dx, dy);
    const isHorizontal = swipeDirection === 'horizontal';
    let angle = toDegrees(Math.atan2(Math.abs(dy), Math.abs(dx)));
    angle = isHorizontal ? angle : 90 - angle;
    const vDirection = dy < 0 ? 'up' : 'down';
    const hDirection = dx < 0 ? 'left': 'right';
    return {
      angle,
      normalDistance: dist / Math.max(width, height),
      pixelDistance: dist,
      isValid: angle < swipeAngleThreshold && dist > swipeDistanceThreshold,
      direction: isHorizontal ? hDirection : vDirection,
    }
  }

  private onUp = (e: PointerEvent) => {
    this.updatePosition(e);
    const swipe = this.getSwipe();
    if (swipe.isValid) {
      this.emit('swipe', {
        ...this.wrapEvent(e),
        swipe,
      });
    }
    this.emit('up', this.wrapEvent(e));
  }

  get x() {
    const { normalize, pixelPosition, normalPosition } = this;
    return normalize ? normalPosition[0] : pixelPosition[0];
  }

  get y() {
    const { normalize, pixelPosition, normalPosition } = this;
    return normalize ? normalPosition[1] : pixelPosition[1];
  }
}