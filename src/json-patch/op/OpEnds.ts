import type {CompactEndsOp} from '../codec/compact/types';
import {AbstractPredicateOp} from './AbstractPredicateOp';
import {OperationEnds} from '../types';
import {find, Path, formatJsonPointer} from '../../json-pointer';
import {OPCODE} from '../constants';
import {AbstractOp} from './AbstractOp';

/**
 * @category JSON Predicate
 */
export class OpEnds extends AbstractPredicateOp<'ends'> {
  // tslint:disable-next-line variable-name
  constructor(path: Path, public readonly value: string, public readonly ignore_case: boolean) {
    super(path);
  }

  public op() {
    return 'ends' as 'ends';
  }

  public test(doc: unknown): boolean {
    const {val} = find(doc, this.path);
    if (typeof val !== 'string') return false;
    const outer = this.ignore_case ? val.toLowerCase() : val;
    const inner = this.ignore_case ? this.value.toLowerCase() : this.value;
    const test = outer.endsWith(inner);
    return test;
  }

  public toJson(parent?: AbstractOp): OperationEnds {
    const op: OperationEnds = {
      op: 'ends',
      path: formatJsonPointer(parent ? this.path.slice(parent.path.length) : this.path),
      value: this.value,
    };
    if (this.ignore_case) (op as any).ignore_case = this.ignore_case;
    return op;
  }

  public toCompact(parent?: AbstractOp): CompactEndsOp {
    const packed: CompactEndsOp = [OPCODE.ends, parent ? this.path.slice(parent.path.length) : this.path, this.value];
    if (this.ignore_case) packed.push(1);
    return packed;
  }
}
