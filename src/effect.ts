import { WebGLImage } from "./image";
import { WebGLCanvasTarget } from './canvas-target';

const glImage = new WebGLImage();

export class ImageEffect {
  private images: HTMLElement[];
  private glTargets: Map<HTMLElement, WebGLCanvasTarget>;
  private observer: IntersectionObserver;
  constructor(selector: string) {
    this.glTargets = new Map();
    this.images = Array.from(document.querySelectorAll(selector));
    this.observer = new IntersectionObserver(this.onIntersect, {
      threshold: 0,
    });
    this.bind();
  }

  onIntersect = (entries: IntersectionObserverEntry[]) => {
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const target = this.glTargets.get(entry.target as HTMLElement);
      target.active = entry.isIntersecting;
    }
  }

  async bind() {
    const { images, observer } = this;
    for (let i = 0; i < images.length; i++) {
      const image = images[i]
      observer.observe(image);
      const src = image.getAttribute('data-image');
      const target = new WebGLCanvasTarget(glImage.gl);
      this.glTargets.set(image, target);
      glImage.addTarget(target);
      await target.loadImage(src);
      image.appendChild(target.canvas);
      target.setSize(image.clientWidth, image.clientHeight);

    }
  }
}