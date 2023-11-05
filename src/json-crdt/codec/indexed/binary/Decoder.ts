import {
  ConNode,
  JsonNode,
  ValNode,
  ArrNode,
  ArrChunk,
  BinNode,
  BinChunk,
  ObjNode,
  StrNode,
  StrChunk,
} from '../../../nodes';
import {ClockTable} from '../../../../json-crdt-patch/codec/clock/ClockTable';
import {CrdtReader} from '../../../../json-crdt-patch/util/binary/CrdtDecoder';
import {IndexedFields, FieldName, IndexedNodeFields} from './types';
import {ITimestampStruct, IVectorClock, Timestamp, VectorClock} from '../../../../json-crdt-patch/clock';
import {Model, UNDEFINED} from '../../../model/Model';
import {MsgPackDecoderFast} from '../../../../json-pack/msgpack';

export class Decoder {
  public readonly dec = new MsgPackDecoderFast<CrdtReader>(new CrdtReader());
  protected doc!: Model;
  protected clockTable?: ClockTable;

  public decode<M extends Model>(
    fields: IndexedFields,
    ModelConstructor: new (clock: IVectorClock) => M = Model as unknown as new (clock: IVectorClock) => M,
  ): M {
    const reader = this.dec.reader;
    reader.reset(fields.c);
    const clockTable = (this.clockTable = ClockTable.decode(reader));
    return this.decodeFields(clockTable, fields, ModelConstructor);
  }

  public decodeFields<M extends Model>(
    clockTable: ClockTable,
    fields: IndexedNodeFields,
    ModelConstructor: new (clock: IVectorClock) => M = Model as unknown as new (clock: IVectorClock) => M,
  ): M {
    const reader = this.dec.reader;
    const firstClock = clockTable.byIdx[0];
    const vectorClock = new VectorClock(firstClock.sid, firstClock.time + 1);
    const doc = (this.doc = new ModelConstructor(vectorClock));
    const root = fields.r;
    if (root && root.length) {
      reader.reset(root);
      const rootValue = this.ts();
      doc.root.set(rootValue);
    }
    const docIndex = doc.index;
    for (const field in fields) {
      if (field.length < 3) continue; // Skip "c" and "r".
      const arr = fields[field as FieldName];
      const id = clockTable.parseField(field as FieldName);
      reader.reset(arr);
      const node = this.decodeNode(id);
      docIndex.set(node.id, node);
    }
    return doc;
  }

  protected ts(): ITimestampStruct {
    const [sessionIndex, timeDiff] = this.dec.reader.id();
    return new Timestamp(this.clockTable!.byIdx[sessionIndex].sid, timeDiff);
  }

  protected decodeNode(id: ITimestampStruct): JsonNode {
    const reader = this.dec.reader;
    const byte = reader.u8();
    if (byte <= 0b10001111) return this.cObj(id, byte & 0b1111);
    else if (byte <= 0b10011111) return this.cArr(id, byte & 0b1111);
    else if (byte <= 0b10111111) return this.cStr(id, byte & 0b11111);
    else {
      switch (byte) {
        case 0xc4:
          return this.cBin(id, reader.u8());
        case 0xc5:
          return this.cBin(id, reader.u16());
        case 0xc6:
          return this.cBin(id, reader.u32());
        case 0xd4:
          return this.cConst(id);
        case 0xd5:
          return new ConNode(id, this.ts());
        case 0xd6:
          return this.cVal(id);
        case 0xde:
          return this.cObj(id, reader.u16());
        case 0xdf:
          return this.cObj(id, reader.u32());
        case 0xdc:
          return this.cArr(id, reader.u16());
        case 0xdd:
          return this.cArr(id, reader.u32());
        case 0xd9:
          return this.cStr(id, reader.u8());
        case 0xda:
          return this.cStr(id, reader.u16());
        case 0xdb:
          return this.cStr(id, reader.u32());
      }
    }

    return UNDEFINED;
  }

  public cConst(id: ITimestampStruct): ConNode {
    const val = this.dec.val();
    return new ConNode(id, val);
  }

  public cVal(id: ITimestampStruct): ValNode {
    const val = this.ts();
    return new ValNode(this.doc, id, val);
  }

  public cObj(id: ITimestampStruct, length: number): ObjNode {
    const decoder = this.dec;
    const obj = new ObjNode(this.doc, id);
    const keys = obj.keys;
    for (let i = 0; i < length; i++) {
      const key = String(decoder.val());
      const val = this.ts();
      keys.set(key, val);
    }
    return obj;
  }

  protected cStr(id: ITimestampStruct, length: number): StrNode {
    const decoder = this.dec;
    const node = new StrNode(id);
    node.ingest(length, () => {
      const chunkId = this.ts();
      const val = decoder.val();
      if (typeof val === 'number') return new StrChunk(chunkId, val, '');
      const data = String(val);
      return new StrChunk(chunkId, data.length, data);
    });
    return node;
  }

  protected cBin(id: ITimestampStruct, length: number): BinNode {
    const decoder = this.dec;
    const reader = decoder.reader;
    const node = new BinNode(id);
    node.ingest(length, () => {
      const chunkId = this.ts();
      const [deleted, length] = reader.b1vu28();
      if (deleted) return new BinChunk(chunkId, length, undefined);
      const data = reader.buf(length);
      return new BinChunk(chunkId, length, data);
    });
    return node;
  }

  protected cArr(id: ITimestampStruct, length: number): ArrNode {
    const decoder = this.dec;
    const reader = decoder.reader;
    const node = new ArrNode(this.doc, id);
    node.ingest(length, () => {
      const chunkId = this.ts();
      const [deleted, length] = reader.b1vu28();
      if (deleted) return new ArrChunk(chunkId, length, undefined);
      const data: ITimestampStruct[] = [];
      for (let i = 0; i < length; i++) data.push(this.ts());
      return new ArrChunk(chunkId, length, data);
    });
    return node;
  }
}
