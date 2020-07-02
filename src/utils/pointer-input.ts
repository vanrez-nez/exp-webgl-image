import EventEmitter from './event-emitter';
import { mapToRange } from './math';
import { PointerEvent } from './pointer-events';
import PointerEvents from './pointer-events';

export default class PointerInput extends EventEmitter {
  private target: HTMLElement;
  private input: PointerEvents;
  private normalize: boolean;
  private remapX: number[];
  private remapY: number[];
  private lastX: number;
  private lastY: number;

  constructor(target: HTMLElement, {
    normalize = false,
    remapX = [],
    remapY = [],
  }) {
    super();
    this.normalize = normalize;
    this.remapX = remapX;
    this.remapY = remapY;
    this.target = target;
    this.input = new PointerEvents({ target });
    this.input.on('move', this.onMove);
  }

  private onMove = (e: PointerEvent) => {
    const { remapX, remapY, normalize, target } = this;
    const { width, height, left, top } = target.getBoundingClientRect();
    let x = e.clientX - left;
    let y = e.clientY - top;
    if (normalize) {
      x /= width;
      y /= height;
      x = remapX.length === 2 ? mapToRange(x, 0, 1, remapX[0], remapX[1]) : x;
      y = remapY.length === 2 ? mapToRange(y, 0, 1, remapY[0], remapY[1]) : y;
    }
    this.lastX = x;
    this.lastY = y;
    this.emit('move', { x, y });
  }

  get x() {
    return this.lastX;
  }

  get y() {
    return this.lastY;
  }
}