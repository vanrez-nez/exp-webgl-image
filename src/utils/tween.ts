import { lerp } from './math';
import { nextFrame } from './next-frame';
import { Clock } from './clock';

interface TweenProperty {
  target: any;
  key: string;
  start: number;
  end: number;
}

type EasingFunction = (x: number) => number;

export const linear = (t: number) => t;
export const easingQuinticInOut = (t: number) => t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t;

export class Tween {
  private duration: number;
  private delay: number;
  private clock: Clock;
  private easeFunction: EasingFunction;
  private tweens: TweenProperty[];

  constructor(target: object, time: number, props: any) {
    this.duration = time;
    this.clock = new Clock();
    this.tweens = [];
    this.delay = 0;
    this.easeFunction = linear;
    for (let key in props) {
      this.tweens.push({
        target,
        key,
        start: target[key],
        end: props[key],
      });
    }
  }

  setEasing(fn: EasingFunction) {
    this.easeFunction = fn;
    return this;
  }

  setDelay(amount: number) {
    this.delay = amount;
    return this;
  }

  updateProperties(progress: number) {
    const { tweens, easeFunction } = this;
    let updatedProps = 0;
    for (let i = 0; i < tweens.length; i++) {
      const { start, end, target, key } = tweens[i];
      target[key] = lerp(start, end, easeFunction(progress));
      if (progress < 1) {
        updatedProps++;
      }
    }
    return updatedProps;
  }

  start() {
    this.clock.start();
    this.update();
    return this;
  }

  update = () => {
    const { clock, duration, delay } = this;
    const elapsed = Math.max(0, clock.getElapsedTime() - delay);
    const progress = Math.min(1, elapsed / duration);
    if (this.updateProperties(progress) > 0) {
      nextFrame(this.update);
    }
  }
}