import type {CompactDefinedOp} from '../codec/compact/types';
import {AbstractPredicateOp} from './AbstractPredicateOp';
import {OperationDefined} from '../types';
import {find, Path, formatJsonPointer} from '../../json-pointer';
import {OPCODE} from '../constants';

/**
 * @category JSON Predicate
 */
export class OpDefined extends AbstractPredicateOp<'defined'> {
  constructor(path: Path) {
    super(path);
  }

  public op() {
    return 'defined' as 'defined';
  }

  public test(doc: unknown) {
    const {val} = find(doc, this.path);
    const test = val !== undefined;
    return test;
  }

  public toJson(): OperationDefined {
    const op: OperationDefined = {
      op: 'defined',
      path: formatJsonPointer(this.path),
    };
    return op;
  }

  public toPacked(): CompactDefinedOp {
    const packed: CompactDefinedOp = [OPCODE.defined, this.path];
    return packed;
  }
}
