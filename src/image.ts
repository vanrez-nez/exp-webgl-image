import { nextFrame } from './utils';
import { GL } from './wgl/wgl-const';
import {
  createContext,
} from './wgl';
import { WebGLCanvasTarget } from './canvas-target';

export class WebGLImage {
  public gl: WebGLRenderingContext;
  private canvas: HTMLCanvasElement;
  private targets: WebGLCanvasTarget[];

  constructor() {
    this.canvas = document.createElement('canvas');
    this.gl = createContext(this.canvas, 'webgl2');
    this.targets = [];
    this.render();
  }

  updateSize() {
    const { targets, gl} = this;
    const { clientWidth: width, clientHeight: height } = gl.canvas as HTMLCanvasElement;
    //targets.forEach(t => t.setSize(width, height));
  }

  addTarget(target: WebGLCanvasTarget) {
    this.targets.push(target);
  }

  render = () => {
    const { gl, targets } = this;
    if (gl.isContextLost()) return;
    this.updateSize();
    for (let i = 0; i < targets.length; i++) {
      targets[i].renderTarget(gl);
    }
    nextFrame(this.render);
  }
}
