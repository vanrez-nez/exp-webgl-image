import { TweenLite } from 'gsap';
import { Clock, getSizeToCover } from './utils';
import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';
import ImageNoise from '../assets/noise.png';

import {
  GL,
  resizeViewport,
} from './wgl';

import {
  ProgramUniform,
  ProgramAttribute,
  Texture2D,
  FrameBuffer,
  createProgram,
  getUniforms,
  getAttributes,
} from './wgl';

export class WebGLCanvasTarget {

  public active: boolean;
  private loaded: boolean;
  private src: string;
  private gl: WebGLRenderingContext;
  public canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private clock: Clock;
  private width: number;
  private height: number;
  private frameBuffer: FrameBuffer;
  private noiseTexture: Texture2D;
  private mainTexture: Texture2D;
  private program: WebGLProgram;
  private uniforms: Map<string, ProgramUniform>;
  private attributes: Map<string, ProgramAttribute>;

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    this.clock = new Clock();
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
    this.frameBuffer = new FrameBuffer(gl, 0, 0);
    this.width = 0;
    this.height = 0;
    this.loaded = false;
    this.createProgram();
  }

  async loadImage(src: string) {
    this.src = src;
    await this.initTextures();
    this.loaded = true;
  }

  createFrameBuffer() {
    const { gl, mainTexture, canvas } = this;
    this.frameBuffer = new FrameBuffer(gl, this.width, this.height);
    this.frameBuffer.bind();
  }

  async initTextures() {
    const { gl } = this;
    this.mainTexture = new Texture2D(gl, { flipY: false });
    this.mainTexture.unitId = 0;
    this.noiseTexture = new Texture2D(gl);
    this.noiseTexture.unitId = 1;
    await Promise.all([
      this.mainTexture.load(this.src),
      this.noiseTexture.load(ImageNoise),
    ]);
    this.uniforms.get('u_tImage').value = 0;
    this.uniforms.get('u_tNoise').value = 1;
  }

  setSize(width: number, height: number) {
    const { gl, uniforms, canvas } = this;
    const { image } = this.mainTexture;
    if (this.width === width && this.height === height) return;
    this.width = width;
    this.height = height;
    canvas.width = width;
    canvas.height = height;
    console.log('createBuffer');
    this.createFrameBuffer();
    if (image) {
      const { width: nW, height: nH } = image;
      const [w, h] = getSizeToCover(nW / width, nH / height, 1, 1);
      // const [w, h] = getSizeToContain(nW / width, nH / height, 1, 1);
      gl.useProgram(this.program);
      uniforms.get('u_scale').value = [w, h];
      uniforms.get('u_offset').value = [0, 0];
      uniforms.get('u_origin').value = [0.5, 0.5];

      const ratioMax = Math.max(width, height);
      uniforms.get('u_ratio').value = [width / ratioMax, height / ratioMax];
    }
  }

  createProgram() {
    const { gl } = this;
    this.program = createProgram(gl, vertexShader, fragmentShader);
    gl.useProgram(this.program);
    this.uniforms = getUniforms(gl, this.program);
    this.attributes = getAttributes(gl, this.program);
    this.initAttributes();
  }

  drawToCanvas() {
    const { gl, context, width, height } = this;
    if (width * height === 0) return;
    const pixels = new Uint8ClampedArray(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    const imgData = new ImageData(pixels, width, height);
    context.globalCompositeOperation = 'copy';
    context.putImageData(imgData, 0, 0);
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

  makeWave = () => {
    const { uniforms } = this;
    const time = uniforms.get('u_time');
    const intensity = uniforms.get('u_waveIntensity');
    const scale = uniforms.get('u_waveScale');
    scale.value = 2;
    intensity.value = 2;
    // TweenLite.fromTo(scale, 1, { value: 1 }, { value: 2.5 });
    // TweenLite.fromTo(time, 2, { value: 0 }, { value: 3, ease: 'Quad.easeInOut' });
    // TweenLite.fromTo(intensity, 1, { value: 0.01 }, { value: 1, ease: 'Quad.easeIn' });
    // TweenLite.to(intensity, 1, { value: 0.01, delay: 1, ease: 'Quad.easeOut' });
  }

  updateUniforms() {
    const { uniforms, clock, gl } = this;
    uniforms.get('u_time').value += clock.getDelta();
    uniforms.get('u_waveIntensity').value = 1;
    uniforms.get('u_waveScale').value = 1;
  }

  renderTarget(gl: WebGLRenderingContext) {
    this.canvas.style.opacity = this.active ? '1' : '0';
    gl.useProgram(this.program);
    this.updateUniforms();
    if (this.active && this.loaded) {
      this.mainTexture.bindTexture();
      this.noiseTexture.bindTexture();
      resizeViewport(gl, this.width, this.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(GL.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      this.drawToCanvas();
    }
  }
}