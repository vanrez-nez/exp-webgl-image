import { GL } from './wgl-const';

function padLeft(str: string, length: number, pad: string) {
  return (pad.repeat(length) + str).slice(-length);
}

function logProgramError(error: string, source: string) {
  const errStr = error.match(/ERROR:.+\:(\d+)/);
  if (errStr[1]) {
    let i = 1;
    const eLine = Number(errStr[1]) - 1;
    const formatFn = () => padLeft(`${i++}:\t`, 6, '');
    const lines = source.replace(/^/gm, formatFn).split('\n');
    const from = Math.max(eLine - 10, 0);
    const to = Math.min(eLine + 10, lines.length);
    console.group(`%c${error}`, 'color:tomato;');
    console.log('%c%s%c%s%c%s',
      'color:gray', lines.slice(from, eLine).join('\n'),
      'color:default;', `\n${lines[eLine]}\n`,
      'color:gray', lines.slice(eLine + 1, to).join('\n'),
    );
    console.groupEnd();
  }
}

export function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, GL.COMPILE_STATUS);
  const contextLost = gl.isContextLost();
  if (!success && !contextLost) {
    const error = gl.getShaderInfoLog(shader);
    logProgramError(error, source);
  }
  return shader;
}

export function createProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) {
  const program = gl.createProgram();
  const vertex = compileShader(gl, GL.VERTEX_SHADER, vertexSource);
  const fragment = compileShader(gl, GL.FRAGMENT_SHADER, fragmentSource);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  const linked = gl.getProgramParameter(program, GL.LINK_STATUS);
  const contextLost = gl.isContextLost();
  if (!linked && !contextLost) {
    const error = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    console.warn('Program link error:', error);
    return;
  }
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  return program;
}
