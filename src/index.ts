import { loadImage, Clock, PointerInput } from './utils';

import {
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
  private pointer: PointerInput;
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
    this.pointer = new PointerInput(canvas, {
      normalize: true,
      remapX: [0, 1],
      remapY: [1, 0],
    });
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
    const { gl, uniforms } = this;
    const { height, width } = gl.canvas;
    const { innerWidth, innerHeight } = window;
    resizeViewport(gl, innerWidth, innerHeight);
    const maxSize = Math.min(height, width);
    uniforms.get('u_ratio').value = [width / maxSize, height / maxSize];
    uniforms.get('u_resolution').value = [width, height];
  }

  updateUniforms() {
    const { uniforms, clock, pointer, gl } = this;
    uniforms.get('u_time').value += clock.getDelta();
    uniforms.get('u_mouse').value = [pointer.x, pointer.y];
  }

  render() {
    const { gl, attributes } = this;
    this.updateSize();
    this.updateUniforms();
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    requestAnimationFrame(this.render.bind(this));
  }
}

new WebGLApplication();