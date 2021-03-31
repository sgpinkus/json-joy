import {computeMaxSize} from "./util/computeMaxSize";
import {encodeString as encodeStringRaw} from "../util/encodeString";
import {isFloat32} from "../util/isFloat32";
import {isArrayBuffer} from "../util/isArrayBuffer";
import {JsonPackValue} from "./JsonPackValue";
import {JsonPackExtension} from "./JsonPackExtension";

const writeBuffer = (view: DataView, buf: ArrayBuffer, offset: number): number => {
  const dest = new Uint8Array(view.buffer);
  const src = new Uint8Array(buf);
  dest.set(src, offset);
  return offset + buf.byteLength;
};

const encodeNull = (view: DataView, offset: number): number => {
  view.setUint8(offset++, 0xc0);
  return offset;
};

const encodeFalse = (view: DataView, offset: number): number => {
  view.setUint8(offset++, 0xc2);
  return offset;
};

const encodeTrue = (view: DataView, offset: number): number => {
  view.setUint8(offset++, 0xc3);
  return offset;
};

const encodeNumber = (view: DataView, offset: number, num: number): number => {
  const isInteger = num === Math.round(num);
  if (isInteger) {
    if ((num >= 0) && (num <= 0b1111111)) {
      view.setUint8(offset++, num);
      return offset;
    }
    if ((num < 0) && (num >= -0b100000)) {
      view.setUint8(offset++, 0b11100000 | (-num - 1));
      return offset;
    }
    if (num > 0) {
      if (num <= 0xFF) {
        view.setUint16(offset, (0xcc << 8) | num);
        return offset + 2;
      } else if (num <= 0xFFFF) {
        view.setUint8(offset++, 0xcd);
        view.setUint16(offset, num);
        return offset + 2;
      } else if (num <= 0xFFFFFFFF) {
        view.setUint8(offset++, 0xce);
        view.setUint32(offset, num);
        return offset + 4;
      } else {
        let lo32 = num | 0;
        if (lo32 < 0) lo32 += 4294967296;
        const hi32 = (num - lo32) / 4294967296;
        view.setUint8(offset++, 0xcf);
        view.setUint32(offset, hi32);
        offset += 4;
        view.setUint32(offset, lo32);
        return offset + 4;
      }
    } else {
      if (num > -0x7F) {
        view.setUint8(offset++, 0xd0);
        view.setInt8(offset++, num);
        return offset;
      } else if (num > -0x7FFF) {
        view.setUint8(offset++, 0xd1);
        view.setInt16(offset, num);
        return offset + 2;
      } else if (num > -0x7FFFFFFF) {
        view.setUint8(offset++, 0xd2);
        view.setInt32(offset, num);
        return offset + 4;
      } else {
        let lo32 = num | 0;
        if (lo32 < 0) lo32 += 4294967296;
        const hi32 = (num - lo32) / 4294967296;
        view.setUint8(offset++, 0xd3);
        view.setInt32(offset, hi32);
        offset += 4;
        view.setInt32(offset, lo32);
        return offset + 4;
      }
    }
  }
  if (isFloat32(num)) {
    view.setUint8(offset++, 0xca);
    view.setFloat32(offset, num);
    return offset + 4;  
  }
  view.setUint8(offset++, 0xcb);
  view.setFloat64(offset, num);
  return offset + 8;
};

const encodeString = (view: DataView, offset: number, str: string): number => {
  const buf = encodeStringRaw(str);
  const size = buf.byteLength;
  if (size <= 0b11111) {
    view.setUint8(offset++, 0b10100000 | size);
    writeBuffer(view, buf, offset);
    return offset + size;
  }
  if (size <= 0xFF) {
    view.setUint8(offset++, 0xd9);
    view.setUint8(offset++, size);
    writeBuffer(view, buf, offset);
    return offset + size;
  }
  if (size <= 0xFFFF) {
    view.setUint8(offset++, 0xda);
    view.setUint16(offset, size);
    offset += 2;
    writeBuffer(view, buf, offset);
    return offset + size;
  }
  if (size <= 0xFFFFFFFF) {
    view.setUint8(offset++, 0xdb);
    view.setUint32(offset, size);
    offset += 4;
    writeBuffer(view, buf, offset);
    return offset + size;
  }
  return offset;
};

const encodeArray = (view: DataView, offset: number, arr: unknown[]): number => {
  const length = arr.length;
  if (length <= 0b1111) {
    view.setUint8(offset++, 0b10010000 | length);
  } else if (length <= 0xFFFF) {
    view.setUint8(offset++, 0xdc);
    view.setUint16(offset, length);
    offset += 2;
  } else if (length <= 0xFFFFFFFF) {
    view.setUint8(offset++, 0xdd);
    view.setUint32(offset, length);
    offset += 4;
  } else return offset;
  for (let i = 0; i < length; i++) offset = encodeAny(view, offset, arr[i]);
  return offset;
};

const encodeObject = (view: DataView, offset: number, obj: Record<string, unknown>): number => {
  const keys = Object.keys(obj);
  const length = keys.length;
  if (length <= 0b1111) {
    view.setUint8(offset++, 0b10000000 | length);
  } else if (length <= 0xFFFF) {
    view.setUint8(offset++, 0xde);
    view.setUint16(offset, length);
    offset += 2;
  } else if (length <= 0xFFFFFFFF) {
    view.setUint8(offset++, 0xdf);
    view.setUint32(offset, length);
    offset += 4;
  } else return offset;
  for (let i = 0; i < length; i++) {
    const key = keys[i];
    offset = encodeString(view, offset, key);
    offset = encodeAny(view, offset, obj[key]);
  }
  return offset;
};

const encodeArrayBuffer = (view: DataView, offset: number, buf: ArrayBuffer): number => {
  const length = buf.byteLength
  if (length <= 0xFF) {
    view.setUint8(offset++, 0xc4);
    view.setUint8(offset++, length);
    const dest = new Uint8Array(view.buffer);
    const src = new Uint8Array(buf);
    dest.set(src, offset);
    return offset + length;
  } else if (length <= 0xFFFF) {
    view.setUint8(offset++, 0xc5);
    view.setUint16(offset, length);
    offset += 2;
    writeBuffer(view, buf, offset);
    return offset + length;
  } else if (length <= 0xFFFFFFFF) {
    view.setUint8(offset++, 0xc6);
    view.setUint32(offset, length);
    offset += 4;
    writeBuffer(view, buf, offset);
    return offset + length;
  }
  return offset;
};

const encodeFixedLenExtension = (view: DataView, offset: number, buf: ArrayBuffer, firstTwo: number): number => {
  view.setUint16(offset, firstTwo);
  return writeBuffer(view, buf, offset + 2);
};

const encodeExtension = (view: DataView, offset: number, ext: JsonPackExtension): number => {
  const {type, buf} = ext;
  const length = buf.byteLength;
  switch(length) {
    case 1: return encodeFixedLenExtension(view, offset, buf, (0xd4 << 8) | type);
    case 2: return encodeFixedLenExtension(view, offset, buf, (0xd5 << 8) | type);
    case 4: return encodeFixedLenExtension(view, offset, buf, (0xd6 << 8) | type);
    case 8: return encodeFixedLenExtension(view, offset, buf, (0xd7 << 8) | type);
    case 16: return encodeFixedLenExtension(view, offset, buf, (0xd8 << 8) | type);
  }
  if (length <= 0xFF) {
    view.setUint16(offset, (0xc7 << 8) | length);
    offset += 2;
    view.setUint8(offset++, type);
    return writeBuffer(view, buf, offset);
  } else if (length <= 0xFFFF) {
    view.setUint8(offset++, 0xc8);
    view.setUint16(offset, length);
    offset += 2;
    view.setUint8(offset++, type);
    return writeBuffer(view, buf, offset);
  } else if (length <= 0xFFFFFFFF) {
    view.setUint8(offset++, 0xc9);
    view.setUint32(offset, length);
    offset += 4;
    view.setUint8(offset++, type);
    return writeBuffer(view, buf, offset);
  }
  return offset;
};

const encodeAny = (view: DataView, offset: number, json: unknown): number => {
  switch (json) {
    case null: return encodeNull(view, offset);
    case false: return encodeFalse(view, offset);
    case true: return encodeTrue(view, offset);
  }
  switch (typeof json) {
    case 'number': return encodeNumber(view, offset, json);
    case 'string': return encodeString(view, offset, json);
    case 'object': {
      if (json instanceof Array) return encodeArray(view, offset, json);
      if (json instanceof JsonPackValue) return writeBuffer(view, json.buf, offset);
      if (json instanceof JsonPackExtension) return encodeExtension(view, offset, json);
      if (isArrayBuffer(json)) return encodeArrayBuffer(view, offset, json);
      return encodeObject(view, offset, json as Record<string, unknown>);
    }
  }
  return offset;
};

export const encode = (json: unknown): ArrayBuffer => {
  const maxSize = computeMaxSize(json);
  const buffer = new ArrayBuffer(maxSize);
  const view = new DataView(buffer);
  const offset = encodeAny(view, 0, json);
  return view.buffer.slice(0, offset);
};
