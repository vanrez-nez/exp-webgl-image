import EventEmitter from './event-emitter';
import { mapToRange } from './math';
import { PointerEvents, PointerEvent } from './pointer-events';

type PointArray = [number, number];
type RangeArray = [number, number];

export interface PointerInputOptions {
  normalize?: boolean;
  remapX?: RangeArray;
  remapY?: RangeArray;
}

export interface PointerInputEvent {
  event: PointerEvent,
  x: number,
  y: number,
  normalPosition: PointArray,
  pixelPosition: PointArray,
}

export class PointerInput extends EventEmitter {
  protected target: HTMLElement;
  protected input: PointerEvents;
  protected pixelPosition: PointArray;
  protected normalPosition: PointArray;
  private normalize: boolean;
  private remapX: RangeArray;
  private remapY: RangeArray;

  constructor(target: HTMLElement, {
    normalize = false,
    remapX = [0, 1] as RangeArray,
    remapY = [0, 1] as RangeArray,

  }: PointerInputOptions) {
    super();
    this.normalize = normalize;
    this.remapX = remapX;
    this.remapY = remapY;

    this.target = target;
    this.pixelPosition = [0, 0];
    this.normalPosition = [0, 0];
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

  protected onMove = (e: PointerEvent) => {
    this.updatePosition(e);
    this.emit('move', this.wrapEvent(e));
  }

  protected onDrag = (e: PointerEvent) => {
    this.updatePosition(e);
    this.emit('drag', this.wrapEvent(e));
  }

  protected onTap = (e: PointerEvent) => {
    this.updatePosition(e);
    this.emit('tap', this.wrapEvent(e));
  }

  protected onDown = (e: PointerEvent) => {
    this.updatePosition(e);
    this.emit('down', this.wrapEvent(e));
  }

  protected onUp = (e: PointerEvent) => {
    this.updatePosition(e);
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