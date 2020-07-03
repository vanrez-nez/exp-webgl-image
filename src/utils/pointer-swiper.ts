import { PointerEvent } from './pointer-events';
import { PointerInputOptions, PointerInput } from "./pointer-input";
import { toDegrees } from './math';

/**
 * TODO: Report proper velocity and acceleration using a low-pass filter
 * TODO: Support other gestures such as pinch, rotate, double-tap or pan
 */

type PointArray = [number, number];
type RangeArray = [number, number];
type SwipeDirection = 'vertical' | 'horizontal';

export interface PointerSwiperOptions extends PointerInputOptions {
  swipeDirection?: SwipeDirection;
  swipeAngleThreshold?: number;
  swipeDistanceThreshold?: number;
}

export class PointerSwiper extends PointerInput {
  private direction: SwipeDirection;
  private angleThreshold: number;
  private distanceThreshold: number;
  private startPosition: PointArray;
  private startTime: number;

  constructor(target: HTMLElement, {
    normalize = false,
    remapX = [0, 1] as RangeArray,
    remapY = [0, 1] as RangeArray,
    swipeDirection = 'horizontal',
    swipeAngleThreshold = 45,
    swipeDistanceThreshold = 10,
  }: PointerSwiperOptions) {
    super(target, {
      normalize,
      remapX,
      remapY,
    });
    this.direction = swipeDirection;
    this.angleThreshold = swipeAngleThreshold;
    this.distanceThreshold = swipeDistanceThreshold;
    this.startPosition = [0, 0];
    this.input.on('down', this.onDown);
    this.input.on('up', this.onUp);
  }

  private getSwipe() {
    const {
      target,
      direction,
      angleThreshold,
      distanceThreshold,
      startPosition,
      startTime,
      pixelPosition
    } = this;
    const { width, height } = target.getBoundingClientRect();
    const dx = pixelPosition[0] - startPosition[0];
    const dy = pixelPosition[1] - startPosition[1];
    const dist = Math.hypot(dx, dy);
    const deltaTime = performance.now() - startTime;
    const speed = dist / deltaTime;
    const isHorizontal = direction === 'horizontal';
    let angle = toDegrees(Math.atan2(Math.abs(dy), Math.abs(dx)));
    angle = isHorizontal ? angle : 90 - angle;
    const vDirection = dy < 0 ? 'up' : 'down';
    const hDirection = dx < 0 ? 'left': 'right';
    const notify = angle < angleThreshold && dist > distanceThreshold;
    return {
      speed,
      angle,
      notify,
      pixelDistance: dist,
      normalDistance: dist / Math.max(width, height),
      direction: isHorizontal ? hDirection : vDirection,
    }
  }

  protected onDown = (e: PointerEvent) => {
    const { startPosition, pixelPosition } = this;
    this.startTime = performance.now();
    startPosition[0] = pixelPosition[0];
    startPosition[1] = pixelPosition[1];
  }

  protected onUp = (e: PointerEvent) => {
    const swipe = this.getSwipe();
    if (swipe.notify) {
      this.emit('swipe', {
        event: e,
        ...swipe,
      });
    }
  }

}