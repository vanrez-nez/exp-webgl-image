import { arraysEqual } from './wgl-utils';

export type Vector4 = [number, number, number, number];

export class WebGLState {
  private gl: WebGLRenderingContext;
  private viewport: Vector4;
  private clearColor: Vector4;
  private program: WebGLProgram;
  private buffer: WebGLBuffer;

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    this.viewport = [0, 0, 0, 0];
    this.clearColor = [0, 0, 0, 0];
    this.program = null;
    this.buffer = null;
  }

  useProgram(program: WebGLProgram) {
    if (this.program !== program) {
      this.gl.useProgram(program);
      this.program = program;
    }
  }

  setViewport(x: number, y: number, width: number, height: number) {
    const newViewport = [x, y, width, height];
    if (!arraysEqual(this.viewport, newViewport)) {
      this.gl.viewport(x, y, width, height);
      this.viewport = newViewport as Vector4;
      console.log('setViewport');
    }
  }

  setClearColor(r: number, g: number, b: number, a: number) {
    const newColor = [r, g, b, a];
    if (!arraysEqual(this.clearColor, [r, g, b, a])) {
      this.gl.clearColor(r, g, b, a);
      this.clearColor = newColor as Vector4;
      console.log('setClearColor');
    }
  }

  bindBuffer(target: number, buffer: WebGLBuffer) {
    if (this.buffer !== buffer) {
      this.gl.bindBuffer(target, buffer);
      this.buffer = buffer;
    }
  }

  bufferData(target: number, data: BufferSource, usage: number) {
    if (this.buffer) {
      this.gl.bufferData(target, data, usage);
    }
  }

  // enableVertexAttribArray?
}

const States: WeakMap<WebGLRenderingContext, WebGLState> = new WeakMap();
export function getState(gl: WebGLRenderingContext) {
  if (!States.has(gl)) {
    States.set(gl, new WebGLState(gl));
  }
  return States.get(gl);
}