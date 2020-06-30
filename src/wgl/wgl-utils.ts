import { GL } from './wgl-const';

const ArrayCacheF32 = {};

export function flatten(array: any, size: number, length: number) {
  if (!shouldFlat(array)) return array;

  let entry = ArrayCacheF32[length];
  if (!entry) {
    entry = new Float32Array(length);
    ArrayCacheF32[length] = entry;
  }

  for (let i = 0; i < array.length; i++) {
    const el = array[i];
    const offset = Math.min(el.length, size * i);
    if (el && el.toArray !== undefined) {
      el.toArray(entry, offset);
    } else {
      entry.set(el, offset);
    }
  }
  return entry;
}

export function shouldFlat(value: any) {
  return isArray(value) && typeof value[0] === 'object'
}

export function arraysEqual(a: any, b: any) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function copyArray(from: any, to: any) {
  for(let i = 0; i < to.length; i++) {
    to[i] = from[i];
  }
  return to;
}

export function isArray(obj: any) {
  return Array.isArray(obj) || ArrayBuffer.isView(obj) && !(obj instanceof DataView);
}

export function typedArrToGLType(arr: any) {
  switch(arr.constructor) {
    case Float32Array: return GL.FLOAT;
    case Uint16Array: return GL.UNSIGNED_SHORT;
    case Uint32Array: return GL.UNSIGNED_INT;
    case Int32Array: return GL.INT;
    case Int16Array: return GL.SHORT;
    case Int8Array: return GL.BYTE;
  }
}