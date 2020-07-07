import { GL } from './wgl-const';
import { typedArrToGLType } from './wgl-utils';
import { getState } from './wgl-state';

export interface AttributeArrayParams {
  size: number;
  normalized?: boolean;
  stride?: number;
  offset?: number;
}

export interface ProgramAttribute {
  bindBuffer(target: number),
  buffer: WebGLBuffer,
  location: WebGLUniformLocation;
  program: WebGLProgram;
  info: WebGLActiveInfo;
}

export class ProgramAttribute {
  public gl: WebGLRenderingContext;
  public buffer: WebGLBuffer;
  public location: WebGLUniformLocation;
  public program: WebGLProgram;
  public info: WebGLActiveInfo;
  public type: GL.BYTE | GL.SHORT | GL.UNSIGNED_SHORT | GL.INT | GL.UNSIGNED_INT | GL.FLOAT;

  constructor(gl: WebGLRenderingContext, program: WebGLProgram, info: WebGLActiveInfo) {
    this.gl = gl;
    this.info = info;
    this.type = GL.FLOAT;
    this.program =  program;
    this.location = gl.getAttribLocation(program, info.name);
    this.buffer = gl.createBuffer();
  }

  bindBuffer(target = GL.ARRAY_BUFFER) {
    getState(this.gl).bindBuffer(target, this.buffer);
  }

  setAttribPointer({ size, normalized = false, stride = 0, offset = 0 }: AttributeArrayParams) {
    const { location, type } = this;
    const loc = location as number;
    this.gl.vertexAttribPointer(loc, size, type, normalized, stride, offset);
  }

  enableAttributeArray() {
    this.gl.enableVertexAttribArray(this.location as number);
  }

  bufferData(data: BufferSource, target = GL.ARRAY_BUFFER) {
    this.bindBuffer(target);
    this.type = typedArrToGLType(data);
    getState(this.gl).bufferData(target, data, GL.STATIC_DRAW);
  }
}

export function getAttributes(gl: WebGLRenderingContext, program: WebGLProgram) {
  let count = gl.getProgramParameter(program, GL.ACTIVE_ATTRIBUTES);
  const attributes: Map<string, ProgramAttribute> = new Map();
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveAttrib(program, i);
    const attr = new ProgramAttribute(gl, program, info);
    attributes.set(info.name, attr);
  }
  return attributes;
}