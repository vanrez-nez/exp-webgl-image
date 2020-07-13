import { nextFrame } from './utils';
import { WebGLCanvasTarget } from './canvas-target';
import {
  GL,
  createContext,
  resizeViewport,
} from './wgl';

export class ImageEffect {

  public gl: WebGLRenderingContext;
  private images: HTMLElement[];
  private canvas: HTMLCanvasElement;
  private targets: Map<HTMLElement, WebGLCanvasTarget>;
  private observer: IntersectionObserver;
  private loaded: boolean;

  constructor(selector: string) {
    this.images = Array.from(document.querySelectorAll(selector));
    this.observer = new IntersectionObserver(this.onIntersect, {
      threshold: 0,
    });
    this.loaded = false;
    this.targets = new Map();
    this.canvas = document.createElement('canvas');
    this.gl = createContext(this.canvas, 'webgl2');
    this.bind();
  }

  onIntersect = (entries: IntersectionObserverEntry[]) => {
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const target = this.targets.get(entry.target as HTMLElement);
      target.active = entry.isIntersecting;
    }
  }

  updateSize() {
    const { gl, targets } = this;
    const { clientWidth: width, clientHeight: height } = gl.canvas as HTMLCanvasElement;
    targets.forEach(t => t.setSize(width, height));
  }

  async bind() {
    const { images, observer, gl, targets } = this;
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const src = image.getAttribute('data-image');
      const target = new WebGLCanvasTarget(gl);
      await target.loadImage(src);
      targets.set(image, target);
      image.appendChild(target.canvas);
      observer.observe(image);
    }
    this.loaded = true;
    this.render();
  }

  render = () => {
    const { gl, targets, loaded } = this;
    if (gl.isContextLost() || !loaded) return;
    targets.forEach((target, image) => {
      const { clientWidth: w, clientHeight: h } = image;
      resizeViewport(gl, w, h);
      target.setSize(w, h);
      target.renderTarget(gl);
    });
    nextFrame(this.render);
  }
}