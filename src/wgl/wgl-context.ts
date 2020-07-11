import { getState } from './wgl-state';

export function createContext(canvas: HTMLCanvasElement, contextType: string, options?: WebGLContextAttributes) {
  const ids = ['webgl2', 'webgl', 'experimental-webgl'];
  const start = ids.indexOf(contextType);
  for (let i = start; i < ids.length; i++) {
    const gl = canvas.getContext(ids[i], options) as WebGLRenderingContext;
    if (gl) {
      return gl;
    }
  }
}

export function resizeViewport(gl: WebGLRenderingContext, width: number, height: number, dpr: number = 1) {
  const { canvas } = gl;
  const [w, h] = [width * dpr, height * dpr];
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
    getState(gl).setViewport(0, 0, w, h);
    Object.assign((canvas as HTMLCanvasElement).style, {
      width: `${width}px`,
      height: `${height}px`
    });
  }
}

export function resizeViewportToCanvas(gl: WebGLRenderingContext, dpr: number = 1) {
  const { clientWidth, clientHeight } = gl.canvas as HTMLCanvasElement;
  if (getState(gl).setViewport(0, 0, clientWidth * dpr, clientHeight * dpr)) {
    gl.canvas.width = clientWidth;
    gl.canvas.height = clientHeight;
    return true;
  }
}