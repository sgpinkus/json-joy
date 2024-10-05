import type {CompactContainsOp, OPCODE_CONTAINS} from '../codec/compact/types';
import type {OperationContains} from '../types';
import {AbstractPredicateOp} from './AbstractPredicateOp';
import {find, Path, formatJsonPointer} from '@jsonjoy.com/json-pointer';
import {OPCODE} from '../constants';
import {AbstractOp} from './AbstractOp';
import type {IMessagePackEncoder} from '@jsonjoy.com/json-pack/lib/msgpack';

/**
 * @category JSON Predicate
 */
export class OpContains extends AbstractPredicateOp<'contains'> {
  // tslint:disable-next-line variable-name
  constructor(
    path: Path,
    public readonly value: string,
    public readonly ignore_case: boolean,
  ) {
    super(path);
  }

  public op() {
    return 'contains' as 'contains';
  }

  public code() {
    return OPCODE.contains;
  }

  public test(doc: unknown): boolean {
    const {val} = find(doc, this.path);
    if (typeof val !== 'string') return false;
    const testValue = this.ignore_case ? val.toLowerCase() : val;
    const testString = this.ignore_case ? this.value.toLowerCase() : this.value;
    const test = testValue.indexOf(testString) > -1;
    return test;
  }

  public toJson(parent?: AbstractOp): OperationContains {
    const op: OperationContains = {
      op: 'contains',
      path: formatJsonPointer(parent ? this.path.slice(parent.path.length) : this.path),
      value: this.value,
    };
    if (this.ignore_case) (op as any).ignore_case = this.ignore_case;
    return op;
  }

  public toCompact(parent: undefined | AbstractOp, verbose: boolean): CompactContainsOp {
    const opcode: OPCODE_CONTAINS = verbose ? 'contains' : OPCODE.contains;
    return this.ignore_case
      ? [opcode, parent ? this.path.slice(parent.path.length) : this.path, this.value, 1]
      : [opcode, parent ? this.path.slice(parent.path.length) : this.path, this.value];
  }

  public encode(encoder: IMessagePackEncoder, parent?: AbstractOp) {
    const ignoreCase = this.ignore_case;
    encoder.encodeArrayHeader(ignoreCase ? 4 : 3);
    encoder.writer.u8(OPCODE.contains);
    encoder.encodeArray(parent ? this.path.slice(parent.path.length) : (this.path as unknown[]));
    encoder.encodeString(this.value);
    if (ignoreCase) encoder.writer.u8(1);
  }
}
