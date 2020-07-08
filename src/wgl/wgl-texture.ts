import { GL } from "./wgl-const";
import { loadImage, resizeImage, isPowerOfTwo } from '@/utils';
import { getCapabilities } from './wgl-capabilities';

export interface TextureConstructorParams {
  format?: number;
  internalFormat?: number;
  type?: number;
  wrapS?: number;
  wrapT?: number;
  minFilter?: number;
  magFilter?: number;
  flipY?: boolean;
  mipmaps?: boolean;
}

export class Texture2D {

  public glTexture: WebGLTexture;
  public image: TexImageSource;
  public unitId: number;
  protected gl: WebGLRenderingContext;
  protected format: number;
  protected internalFormat: number;
  protected type: number;
  protected wrapS: number;
  protected wrapT: number;
  protected flipY: boolean;
  protected magFilter: number;
  protected minFilter: number;
  protected mipmaps: boolean;
  protected loaded: boolean;

  constructor(gl: WebGLRenderingContext, {
    format = GL.RGBA,
    internalFormat = format,
    type = GL.UNSIGNED_BYTE,
    wrapS = GL.CLAMP_TO_EDGE,
    wrapT = GL.CLAMP_TO_EDGE,
    minFilter = GL.LINEAR,
    magFilter = GL.LINEAR,
    flipY = true,
    mipmaps = false,
  }: TextureConstructorParams = {}) {
    this.gl = gl;
    this.format = format;
    this.internalFormat = internalFormat;
    this.type = type;
    this.wrapS = wrapS;
    this.wrapT = wrapT;
    this.minFilter = minFilter;
    this.magFilter = magFilter;
    this.mipmaps = mipmaps;
    this.flipY = flipY;
    this.image = null;
    this.loaded = false;
    this.glTexture = gl.createTexture();
    this.unitId = 0;
  }

  public update() {
    const { gl, image, glTexture, wrapS, wrapT, minFilter, magFilter, flipY } = this;
    gl.activeTexture(GL.TEXTURE0 + this.unitId);
    gl.bindTexture(GL.TEXTURE_2D, glTexture);
    gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, wrapS);
    gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, wrapT);
    gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, magFilter);
    if (flipY) {
      gl.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, 1);
    }
    gl.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, image);
  }

  private resizeTexture() {
    const { gl, image, needsPowerOfTwo } = this;
    const { limits } = getCapabilities(gl);
    const maxSize = limits.maxTextureSize;
    this.image = resizeImage(image as HTMLImageElement, maxSize, needsPowerOfTwo);
  }

  async load(url: string) {
    this.image = await loadImage(url);
    this.loaded = true;
    this.update();
    return this;
  }

  get needsPowerOfTwo() {
    const { gl, wrapS, wrapT, minFilter, isPowerOfTwo } = this;
    const { webgl2 } = getCapabilities(gl);
    return !webgl2 && (!isPowerOfTwo) &&
    (wrapS !== GL.CLAMP_TO_EDGE || wrapT !== GL.CLAMP_TO_EDGE) ||
    (minFilter !== GL.NEAREST && minFilter !== GL.LINEAR);
  }

  get isPowerOfTwo() {
    const { width, height } = this;
    return isPowerOfTwo(width) && isPowerOfTwo(height);
  }

  get width() {
    const { image, loaded } = this;
    return loaded ? image.width : 0;
  }

  get height() {
    const { image, loaded } = this;
    return loaded ? image.height : 0;
  }
}