import { Clock, PointerInput, nextFrame, getSizeToCover } from './utils';
import { GL } from './wgl/wgl-const';
import {
  createContext,
  createProgram,
  getUniforms,
  getAttributes,
  resizeViewportToCanvas,
  ProgramUniform,
  ProgramAttribute,
  Texture2D,
} from './wgl';

import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';
import ImageGrid from '../assets/uv_grid_np2.jpg';
import ImageNoise from '../assets/noise.png';

class WebGLApplication {

  private gl: WebGLRenderingContext;
  private clock: Clock;
  private pointer: PointerInput;
  private program: WebGLProgram;
  private uniforms: Map<string, ProgramUniform>;
  private attributes: Map<string, ProgramAttribute>;
  private noiseTexture: Texture2D;
  private mainTexture: Texture2D;

  constructor(canvas: HTMLCanvasElement) {
    this.gl = createContext(canvas, 'webgl2', { alpha: true });
    this.clock = new Clock();
    this.pointer = new PointerInput(canvas as HTMLCanvasElement, {
      normalize: true,
      remapX: [0, 1],
      remapY: [1, 0],
    });
    this.createProgram();
    this.initTextures();
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

  async initTextures() {
    const { gl } = this;
    this.mainTexture = new Texture2D(gl);
    this.mainTexture.unitId = 0;
    this.noiseTexture = new Texture2D(gl);
    this.noiseTexture.unitId = 1;
    await Promise.all([
      this.mainTexture.load(ImageGrid),
      this.noiseTexture.load(ImageNoise),
    ]);
    this.uniforms.get('u_tImage').value = 0;
    this.uniforms.get('u_tNoise').value = 1;
  }

  updateSize() {
    const { gl, uniforms } = this;
    const { image } = this.mainTexture
    const { clientWidth: width, clientHeight: height } = gl.canvas as HTMLCanvasElement;
    resizeViewportToCanvas(gl);
    if (image) {
      const { width: nW, height: nH } = image;
      const [w, h] = getSizeToCover(nW / width, nH / height, 1, 1);
      // const [w, h] = getSizeToContain(nW / width, nH / height, 1, 1);
      uniforms.get('u_scale').value = [w, h];
      uniforms.get('u_offset').value = [0, 0];
      uniforms.get('u_origin').value = [0.5, 0.5];

      const ratioMax = Math.max(width, height);
      uniforms.get('u_ratio').value = [width / ratioMax, height / ratioMax];
    }
  }

  updateUniforms() {
    const { uniforms, clock, pointer, gl } = this;
    uniforms.get('u_time').value += clock.getDelta();
    uniforms.get('u_mouse').value = [pointer.x, pointer.y];
  }

  render = () => {
    const { gl } = this;
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