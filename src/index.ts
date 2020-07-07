import { loadImage, Clock, PointerInput, nextFrame } from './utils';
import { GL } from './wgl/wgl-const';
import {
  createContext,
  createProgram,
  getUniforms,
  getAttributes,
  resizeViewportToCanvas,
  ProgramUniform,
  ProgramAttribute,
} from './wgl';

import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';
import ImageGrid from '../assets/uv_grid.jpg';

class WebGLApplication {

  private gl: WebGLRenderingContext;
  private clock: Clock;
  private pointer: PointerInput;
  private program: WebGLProgram;
  private uniforms: Map<string, ProgramUniform>;
  private attributes: Map<string, ProgramAttribute>;
  private texture: WebGLTexture;

  constructor(canvas: HTMLCanvasElement) {
    this.gl = createContext(canvas, 'webgl2');
    this.clock = new Clock();
    this.pointer = new PointerInput(canvas as HTMLCanvasElement, {
      normalize: true,
      remapX: [0, 1],
      remapY: [1, 0],
    });
    this.createProgram();
    this.createTexture();
    this.render();
  }

  createProgram() {
    const { gl } = this;
    this.program = createProgram(gl, vertexShader, fragmentShader);
    gl.useProgram(this.program);
    this.uniforms = getUniforms(gl, this.program);
    this.attributes = getAttributes(gl, this.program);
    this.initAttributes();

  }

  initAttributes() {
    const { attributes } = this;

    const pos = attributes.get('position');
    pos.bufferData(new Float32Array([-1, -1, 3, -1, -1, 3]));
    pos.setAttribPointer({ size: 2 });
    pos.enableAttributeArray();

    const uv = attributes.get('uv');
    uv.bufferData(new Float32Array([0, 0, 2, 0, 0, 2]));
    uv.setAttribPointer({ size: 2 });
    uv.enableAttributeArray();
  }

  async createTexture() {
    const { gl, uniforms } = this;
    const image = await loadImage(ImageGrid);
    this.texture = gl.createTexture();
    gl.bindTexture(GL.TEXTURE_2D, this.texture);
    gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
    gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
    gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
    gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
    gl.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, image);
    uniforms.get('u_texture').value = this.texture;
  }

  updateSize() {
    const { gl, uniforms } = this;
    const { clientWidth: width, clientHeight: height } = gl.canvas as HTMLCanvasElement;
    resizeViewportToCanvas(gl);
    const minSize = Math.min(height, width);
    uniforms.get('u_ratio').value = [width / minSize, height / minSize];
    uniforms.get('u_resolution').value = [width, height];
  }

  updateUniforms() {
    const { uniforms, clock, pointer, gl } = this;
    uniforms.get('u_time').value += clock.getDelta();
    uniforms.get('u_mouse').value = [pointer.x, pointer.y];
  }

  render = () => {
    const { gl, attributes } = this;
    if (gl.isContextLost()) return;
    this.updateSize();
    this.updateUniforms();
    gl.clearColor(0, 0, 0, 0);
    gl.clear(GL.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    nextFrame(this.render);
  }
}

const apps = [];

function addInstance() {
  const canvas = document.createElement('canvas');
  const app = new WebGLApplication(canvas);
  apps.push(app);
  document.body.appendChild(canvas);
  console.log('Instances:', apps.length);
}

document.querySelector('#js-add-btn').addEventListener('click', addInstance);
addInstance();