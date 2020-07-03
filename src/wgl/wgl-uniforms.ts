import { GL } from './wgl-const';
import { isArray, arraysEqual, flatten, copyArray } from './wgl-utils';

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

export class ProgramUniform {
  protected current: any;
  protected needsUpdate: boolean;
  public autoUpdate: boolean;
  public location: WebGLUniformLocation;
  public program: WebGLProgram;
  public info: WebGLActiveInfo;
  public parts: any;
  private isArray: boolean;
  private isSampler: boolean;
  private setter: Function;

  constructor(gl: WebGLRenderingContext, program: WebGLProgram, info: WebGLActiveInfo) {
    const { name, size, type } = info;
    this.info = info;
    this.location = gl.getUniformLocation(program, name);
    this.parts = parseUniformName(name);
    this.setter = getUniformSetter(gl, type, size);
    this.current = getUniformDefaultValue(type, size);
    this.isArray = isArray(this.current);
    this.isSampler = type === GL.SAMPLER_2D;
    this.autoUpdate = true;
    this.needsUpdate = true;
    this.update();
  }

  private equals(a: any, b: any) {
    const { isArray } = this;
    return a === b || isArray && arraysEqual(a, b);
  }

  public update() {
    const { location, current } = this;
    if (this.needsUpdate) {
      this.setter(location, current);
      this.needsUpdate = false;
    }
  }

  public set value(value: any) {
    const { isArray, info } = this;
    if (isArray) {
      value = flatten(value, info.size, (this.current as any[]).length);
    }
    if (this.needsUpdate || !this.equals(value, this.current)) {
      this.current = isArray ? copyArray(value, this.current) : value;
      this.needsUpdate = true;
    }
    if (this.autoUpdate) {
      this.update();
    }
  }

  public get value() {
    return this.current;
  }
}

/**
 * Uniform class to store inactive/invalid uniform names
 * Useful to have a placeholder of values when the actual uniform
 * is not active or doesn't exists in current program.
*/
class StubUniform extends ProgramUniform {
  constructor(gl: WebGLRenderingContext, program: WebGLProgram, name: string) {
    super(gl, program, { name, type: GL.BOOL, size: 1 });
    this.autoUpdate = false;
    this.needsUpdate = false;
  }

  set value(value: any) {
    this.current = value;
  }
}

/**
 * Parses a WebGL Uniform name and returns a friendly struct
 * @param name string reported by getActiveUniform()
 */
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

function getSetterName(type: number, size: number) {
  let [suffix] = UNIFORM_DESCRIPTORS[type];
  if (size > 1) {
    // transform 1i/1f suffixes to 1iv/1fv if uniform is an array
    suffix = suffix.replace(/v?$/, 'v');
  }
  return `uniform${suffix}`;
}

const UniformSetters:Map<WebGLRenderingContext, object> = new Map();
function getUniformSetter(gl: WebGLRenderingContext, type: number, size: number) {
  const key = `${type}_${size}`;

  /**
   * Try pulling setters cache object for this rendering instance.
   * We cant share the setters among different rendering contexts.
  */
  if (!UniformSetters.has(gl)) {
    UniformSetters.set(gl, {});
  }
  const setters = UniformSetters.get(gl);

  // Create setter if it doesn't exist
  if (!setters[key]) {
    const glName = getSetterName(type, size);
    const glFunction = gl[glName];
    const isMatrix = /Matrix/.test(glName);
    setters[key] = function setUniform(location: WebGLUniformLocation, value: any) {
      if (isMatrix) {
        glFunction.call(gl, location, false, value);
      } else {
        glFunction.call(gl, location, value);
      }
    };
  }
  return setters[key];
}

function getUniformDefaultValue(type: number, size: number) {
  let value = type === GL.BOOL ? false : 0;
  const [/*suffix*/, arrayClass, componentCount] = UNIFORM_DESCRIPTORS[type];
  if (size > 1 || componentCount > 1) {
    value = new arrayClass(size * componentCount);
    if (type === GL.BOOL) {
      // @ts-ignore
      value.fill(false);
    }
  }
  return value;
}

/**
 * Custom map class to handle the allocations of inactive/invalid uniforms.
 * It serves a stub when the key doesn't exists in original map to avoid raising errors.
 * This happens because getProgramParameter(program, GL.ACTIVE_UNIFORMS) only reports the
 * uniforms in use, so even if a uniform declaration exists, the unused uniforms are
 * cleared during the program compilation.
 */
export class UniformMap extends Map {

  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private stubs: Map<string, StubUniform>;

  constructor(gl: WebGLRenderingContext, program: WebGLProgram) {
    super();
    this.gl = gl;
    this.program = program;
    this.stubs = new Map();
  }

  private allocateStub(key: string) {
    const { gl, program, stubs } = this;
    if (!stubs.has(key)) {
      console.warn(`Using uniform: ${key} as stub (not active in current program)`);
      stubs.set(key, new StubUniform(gl, program, key));
    }
  }

  get(key: string) {
    if (super.has(key)) {
      return super.get(key);
    }
    this.allocateStub(key);
    return this.stubs.get(key);
  }
}

export function getUniforms(gl: WebGLRenderingContext, program: WebGLProgram) {
  const uniforms: UniformMap = new UniformMap(gl, program);
  let count = gl.getProgramParameter(program, GL.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    const uniform = new ProgramUniform(gl, program, info);
    const key = uniform.parts.property.name;
    uniforms.set(key, uniform);
  }
  return uniforms;
}
