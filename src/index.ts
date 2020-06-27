import Clock from './clock';
import { loadImage } from './utils';
import {
  createContext,
  createProgram,
  getUniforms,
  getAttributes,
  resizeViewport,
  ProgramUniform,
  ProgramAttribute,
} from './wgl-utils';

import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';
import ImageGrid from '../assets/uv_grid.png';

class WebGLApplication {

  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private uniforms: Map<string, ProgramUniform>;
  private attributes: Map<string, ProgramAttribute>;

  constructor() {
    const canvas = document.querySelector('#js-canvas') as HTMLCanvasElement;
    this.gl = createContext(canvas, 'webgl2', { alpha: true, antialias: true });
    this.program = createProgram(this.gl, vertexShader, fragmentShader);
    this.uniforms = getUniforms(this.gl, this.program);
    this.attributes = getAttributes(this.gl, this.program);
    this.render();
  }

  async load() {
    const image = await loadImage(ImageGrid);
    console.log('image', image);
  }

  updateSize() {
    const { innerWidth, innerHeight } = window;
    resizeViewport(this.gl, innerWidth, innerHeight);
  }

  render() {
    const { gl } = this;
    this.updateSize();
  }
}

new WebGLApplication();