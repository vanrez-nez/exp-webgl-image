import { GL } from './wgl-const';

export class FrameBuffer {
  private gl: WebGLRenderingContext;
  private width: number;
  private height: number;
  public texture: WebGLTexture;
  public buffer: WebGLFramebuffer;

  constructor(gl: WebGLRenderingContext, width: number, height: number) {
    this.gl = gl;
    this.texture = gl.createTexture();
    this.buffer = gl.createFramebuffer();
    this.width = width;
    this.height = height;
  }

  bind() {
    const { gl, width, height, texture, buffer } = this;
    gl.activeTexture(GL.TEXTURE3);
    gl.bindTexture(GL.TEXTURE_2D, texture);
    //gl.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, width, height, 0, GL.RGBA, GL.UNSIGNED_BYTE, null);
    gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
    gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
    gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
    gl.bindTexture(GL.TEXTURE_2D, null);

    gl.bindFramebuffer(GL.FRAMEBUFFER, buffer);
    gl.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, texture, 0);
  }
}