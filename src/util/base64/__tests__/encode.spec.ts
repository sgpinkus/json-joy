import {encode, createEncode} from '../encode';

const encode2 = createEncode();

const generateBlob = (): Uint8Array => {
  const length = Math.floor(Math.random() * 100) + 1;
  const uint8 = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    uint8[i] = Math.floor(Math.random() * 256);
  }
  return uint8;
};

test('works', () => {
  for (let i = 0; i < 100; i++) {
    const blob = generateBlob();
    const result = encode(blob);
    const result2 = encode2(blob, blob.byteLength);
    const expected = Buffer.from(blob).toString('base64');
    expect(result).toBe(expected);
    expect(result2).toBe(expected);
  }
});