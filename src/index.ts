import { loadImage, Clock } from './utils';

import {
  GL,
  createContext,
  createProgram,
  getUniforms,
  getAttributes,
  resizeViewport,
  ProgramUniform,
  ProgramAttribute,
} from './wgl';

import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';
import ImageGrid from '../assets/uv_grid.png';

class WebGLApplication {

  private gl: WebGLRenderingContext;
  private clock: Clock;
  private program: WebGLProgram;
  private uniforms: Map<string, ProgramUniform>;
  private attributes: Map<string, ProgramAttribute>;

  constructor() {
    const canvas = document.querySelector('#js-canvas') as HTMLCanvasElement;
    this.gl = createContext(canvas, 'webgl2');
    this.clock = new Clock();
    this.program = createProgram(this.gl, vertexShader, fragmentShader);
    this.gl.useProgram(this.program);
    this.uniforms = getUniforms(this.gl, this.program);
    this.attributes = getAttributes(this.gl, this.program);
    this.initAttributes();

    this.render();
  }

  initAttributes() {
    const { attributes } = this;

    const pos = attributes.get('position');
    pos.bufferData(new Float32Array([ -1, -1, 3, -1, -1, 3 ]));
    pos.setAttributeArray({ size: 2 });
    pos.enableAttributeArray();

    const uv = attributes.get('uv');
    uv.bufferData(new Float32Array([ 0, 0, 2, 0, 0, 2 ]));
    uv.setAttributeArray({ size: 2 });
    uv.enableAttributeArray();
  }

  async load() {
    const image = await loadImage(ImageGrid);
    console.log('image', image);
  }

  updateSize() {
    const { innerWidth, innerHeight } = window;
    resizeViewport(this.gl, innerWidth, innerHeight);
  }

  updateUniforms() {
    const { uniforms, clock } = this;
    const u_time = uniforms.get('u_time');
    u_time.value += clock.getDelta();
  }

  render() {
    const { gl, attributes } = this;
    this.updateSize();
    this.updateUniforms();
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(this.render.bind(this));
  }
}

new WebGLApplication();