import { GL } from './gl-const';
import { padLeft } from './utils';

export interface ProgramUniform {
  value: number | boolean | boolean[] | Int32Array | Float32Array;
  location: WebGLUniformLocation;
  program: WebGLProgram;
  info: WebGLActiveInfo;
  parts: any;
}

export interface ProgramAttribute {
  location: WebGLUniformLocation;
  program: WebGLProgram;
  info: WebGLActiveInfo;
}

/*
  TODO: Support newer WebGL2 uniform types. See: https://mzl.la/2OwicBs
*/
const ARR = Array;
const I32 = Int32Array;
const F32 = Float32Array;
const UNIFORM_DESCRIPTORS = {
  // TYPE: [SETTER_SUFFIX, ARRAY_CLASS, COMPONENT_COUNT]
  [GL.BOOL]: ['1i', ARR, 1],
  [GL.INT]: ['1i', I32, 1],
  [GL.FLOAT]: ['1f', F32, 1],
  [GL.BOOL_VEC2]: ['2iv', ARR, 2],
  [GL.BOOL_VEC3]: ['3iv', ARR, 3],
  [GL.BOOL_VEC4]: ['3iv', ARR, 4],
  [GL.INT_VEC2]: ['2iv', I32, 2],
  [GL.INT_VEC3]: ['3iv', I32, 3],
  [GL.INT_VEC4]: ['4iv', I32, 4],
  [GL.FLOAT_VEC2]: ['2fv', F32, 2],
  [GL.FLOAT_VEC3]: ['3fv', F32, 3],
  [GL.FLOAT_VEC4]: ['4fv', F32, 4],
  [GL.FLOAT_MAT2]: ['Matrix2fv', F32, 4],
  [GL.FLOAT_MAT3]: ['Matrix3fv', F32, 9],
  [GL.FLOAT_MAT4]: ['Matrix4fv', F32, 16],
  [GL.SAMPLER_2D]: ['1i', I32, 1],
};

function logProgramError(error: string, source: string) {
  const errStr = error.match(/ERROR:.+\:(\d+)/);
  if (errStr[1]) {
    let i = 1;
    const eLine = Number(errStr[1]) - 1;
    const formatFn = () => padLeft(`${i++}:\t`, 6, '');
    const lines = source.replace(/^/gm, formatFn).split('\n');
    const from = Math.max(eLine - 10, 0);
    const to = Math.min(eLine + 10, lines.length);
    console.group(`%c${error}`, 'color:firebrick;');
    console.log('%c%s%c%s%c%s',
      'color:gray', lines.slice(from, eLine).join('\n'),
      'color:default;', `\n${lines[eLine]}\n`,
      'color:gray', lines.slice(eLine + 1, to).join('\n'),
    );
    console.groupEnd();
  }
}

function parseUniformName(name: string) {
  const parts = name.match(/(\w+)/g);
  const isStruct = name.indexOf('.') > -1;
  const isStructArray = isStruct && !isNaN(Number(parts[1]));
  const isPropArray = !isNaN(Number(parts[parts.length - 1]));
  return {
    isStruct,
    isStructArray,
    isPropArray,
    // Extract uniform parts (order matters)
    property: {
      index: isPropArray ? Number(parts.pop()) : -1,
      name: parts.pop(),
    },
    struct: {
      index: isStructArray ? Number(parts.pop()) : -1,
      name: parts.pop(),
    }
  };
}

function getDescriptor(type: number) {
  const desc = UNIFORM_DESCRIPTORS[type];
  if (!desc) console.warn('Unexpected uniform type', type);
  return desc;
}

function getSetterName(type: number, size: number) {
  let [suffix] = getDescriptor(type);
  if (size > 1) {
    // transform 1i/1f suffixes to 1iv/1fv if uniform is an array
    suffix = suffix.replace(/v?$/, 'v');
  }
  return `uniform${suffix}`;
}

const UniformSetters = {}
function getUniformSetter(gl: WebGLRenderingContext, type: number, size: number) {
  const key = `${type}_${size}`;
  if (!UniformSetters[key]) {
    const glName = getSetterName(type, size);
    const glFunction = gl[glName];
    const isMatrix = /Matrix/.test(glName);
    UniformSetters[key] = function setUniform(location: WebGLUniformLocation, value: any) {
      if (isMatrix) {
        glFunction.call(gl, location, false, value);
      } else {
        glFunction.call(gl, location, value);
      }
    };
  }
  return UniformSetters[key];
}

function getUniformDefaultValue(type: number, size: number) {
  let value = type === GL.BOOL ? false : 0;
  const [/*suffix*/, arrayClass, componentCount] = getDescriptor(type);
  if (size > 1 || componentCount > 1) {
    value = new arrayClass(size * componentCount);
    if (type === GL.BOOL) {
      // @ts-ignore
      value.fill(false);
    }
  }
  return value;
}

function createUniform(gl: WebGLRenderingContext, program: WebGLProgram, info: WebGLActiveInfo) {
  const { name, type, size } = info;
  const location = gl.getUniformLocation(program, name);
  const parts = parseUniformName(name);
  const setter = getUniformSetter(gl, type, size);
  let uvalue = getUniformDefaultValue(type, size);
  return {
    get value() { return uvalue },
    set value(val) {
      setter(location, val),
      uvalue = val;
    },
    program,
    parts,
    info,
    location
  } as ProgramUniform;
}

export function getUniforms(gl: WebGLRenderingContext, program: WebGLProgram) {
  const uniforms: Map<string, ProgramUniform> = new Map();
  let count = gl.getProgramParameter(program, GL.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    const uniform = createUniform(gl, program, info);
    const key = uniform.parts.property.name;
    uniforms.set(key, uniform);
  }
  return uniforms;
}

export function getAttributes(gl: WebGLRenderingContext, program: WebGLProgram) {
  let count = gl.getProgramParameter(program, GL.ACTIVE_ATTRIBUTES);
  const attributes: Map<string, ProgramAttribute> = new Map();
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveAttrib(program, i);
    const location = gl.getAttribLocation(program, info.name);
    attributes.set(info.name, {
      program,
      location,
      info,
    })
  }
  return attributes;
}

export function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, GL.COMPILE_STATUS);
  if (!success) {
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
  if (!linked) {
    const error = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    console.warn('Program link error:', error);
    return;
  }
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  return program;
}

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
    gl.viewport(0, 0, w, h);
    Object.assign((canvas as HTMLCanvasElement).style, {
      width: `${width}px`,
      height: `${height}px`
    });
  }
}