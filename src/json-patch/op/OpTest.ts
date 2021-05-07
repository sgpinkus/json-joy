import type {CompactTestOp} from '../codec/compact/types';
import {OperationTest} from '../types';
import {find, Path, formatJsonPointer} from '../../json-pointer';
import {AbstractPredicateOp} from './AbstractPredicateOp';
import {OPCODE} from '../constants';
const isEqual = require('fast-deep-equal');

/**
 * @category JSON Patch
 * @category JSON Predicate
 */
export class OpTest extends AbstractPredicateOp<'test'> {
  constructor(path: Path, public readonly value: unknown, public readonly not: boolean) {
    super(path);
  }

  public op() {
    return 'test' as 'test';
  }

  public test(doc: unknown) {
    const {val} = find(doc, this.path);
    if (val === undefined) return !!this.not;
    const test = isEqual(val, this.value);
    return this.not ? !test : test;
  }

  public toJson(): OperationTest {
    const op: OperationTest = {
      op: 'test',
      path: formatJsonPointer(this.path),
      value: this.value,
    };
    if (this.not) (op as any).not = this.not;
    return op;
  }

  public toPacked(): CompactTestOp {
    return this.not
      ? [OPCODE.test, this.path, this.value, 1]
      : [OPCODE.test, this.path, this.value];
  }
}
