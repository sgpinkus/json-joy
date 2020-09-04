import {AbstractOp} from './AbstractOp';
import {OperationStrDel} from '../types';
import {find, Path, formatJsonPointer} from '../../json-pointer';
import {OPCODE} from './constants';

export type PackedStrDelOp = [OPCODE.str_del, string | Path, {i: number; s?: string; l?: number}];

export class OpStrDel extends AbstractOp<'str_del'> {
  constructor(
    path: Path,
    public readonly pos: number,
    public readonly str: string | undefined,
    public readonly len: number | undefined,
  ) {
    super('str_del', path);
  }

  public deleteLength(): number {
    return typeof this.str === 'string' ? this.str.length : this.len!;
  }

  public apply(doc: unknown) {
    const {val, key, obj} = find(doc, this.path);
    if (typeof val !== 'string') throw new Error('NOT_A_STRING');
    const length = val.length;
    const pos = Math.min(this.pos, val.length);
    const start = Math.min(pos, length);
    const deletionLength: number = this.str !== undefined ? this.str.length : this.len!;
    const end = Math.min(pos + deletionLength, length);
    const before = val.slice(0, start);
    const after = val.substr(end);
    const result = before + after;
    if (obj) (obj as any)[key as any] = result;
    else doc = result;
    return {doc, old: val};
  }

  public toJson(): OperationStrDel {
    if (typeof this.str === 'string') {
      return {
        op: this.op,
        path: formatJsonPointer(this.path),
        pos: this.pos,
        str: this.str,
      };
    }
    return {
      op: this.op,
      path: formatJsonPointer(this.path),
      pos: this.pos,
      len: this.len,
    };
  }

  public toPacked(): PackedStrDelOp {
    const packed: PackedStrDelOp =
      typeof this.str === 'string'
        ? [OPCODE.str_del, this.path, {i: this.pos, s: this.str}]
        : [OPCODE.str_del, this.path, {i: this.pos, l: this.len}];
    return packed;
  }
}