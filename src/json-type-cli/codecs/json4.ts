import {JsonDecoder} from '../../json-pack/json/JsonDecoder';
import {JsonEncoder} from '../../json-pack/json/JsonEncoder';
import type {Writer} from '../../util/buffers/Writer';
import {bufferToUint8Array} from '../../util/buffers/bufferToUint8Array';
import type {CliCodec} from '../types';

/**
 * JSON codec with 4 space pretty-printing.
 */
export class CliCodecJson4 implements CliCodec<'json4'> {
  public readonly id = 'json4';
  protected readonly encoder: JsonEncoder;
  protected readonly decoder: JsonDecoder;

  constructor(protected readonly writer: Writer) {
    this.encoder = new JsonEncoder(writer);
    this.decoder = new JsonDecoder();
  }

  encode(value: unknown): Uint8Array {
    const uint8 = this.encoder.encode(value);
    const pojo = JSON.parse(Buffer.from(uint8).toString('utf8'));
    const json = JSON.stringify(pojo, null, 4);
    return bufferToUint8Array(Buffer.from(json, 'utf8'));
  }

  decode(bytes: Uint8Array): unknown {
    return this.decoder.read(bytes);
  }
}
