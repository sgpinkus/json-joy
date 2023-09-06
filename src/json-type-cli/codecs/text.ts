import {stringify} from '../../json-text/stringify';
import type {CliCodec} from '../types';

export class CliCodecText implements CliCodec<'text'> {
  public readonly id = 'text';

  encode(value: unknown): Uint8Array {
    const str = stringify(value);
    return new TextEncoder().encode(str);
  }

  decode(bytes: Uint8Array): unknown {
    throw new Error('Not implemented');
  }
}
