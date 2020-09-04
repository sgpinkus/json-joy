import {AbstractOp} from './AbstractOp';
import {OperationReplace} from '../types';
import {find, isObjectReference, isArrayReference, Path, formatJsonPointer} from '../../json-pointer';
import {OPCODE} from './constants';

export type PackedReplaceOp = [OPCODE.replace, Path | string, {v: unknown; o?: unknown}];

export class OpReplace extends AbstractOp<'replace'> {
  constructor(path: Path, public readonly value: unknown, public readonly oldValue: unknown) {
    super('replace', path);
  }

  public apply(doc: unknown) {
    const ref = find(doc, this.path);
    if (ref.val === undefined) throw new Error('NOT_FOUND');
    if (isObjectReference(ref)) ref.obj[ref.key] = this.value;
    else if (isArrayReference(ref)) ref.obj[ref.key] = this.value;
    else doc = this.value;
    return {doc, old: ref.val};
  }

  public toJson(): OperationReplace {
    const json: OperationReplace = {
      op: this.op,
      path: formatJsonPointer(this.path),
      value: this.value,
    };
    if (this.oldValue !== undefined) (json as any).oldValue = this.oldValue;
    return json;
  }

  public toPacked(): PackedReplaceOp {
    const packed: PackedReplaceOp = [OPCODE.replace, this.path, {v: this.value}];
    if (this.oldValue !== undefined) packed[2].o = this.oldValue;
    return packed;
  }
}