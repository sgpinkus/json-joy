import type {LogicalTimestamp} from '../../../json-crdt-patch/clock';
import {UNDEFINED_ID} from '../../../json-crdt-patch/constants';
import {RegisterWriteOp} from './RegisterWriteOp';

export class RegisterType {
  private last: RegisterWriteOp | null = null;

  constructor(public readonly id: LogicalTimestamp) {}

  public insert(op: RegisterWriteOp) {
    if (!this.last) {
      this.last = op;
      return;
    }
    if (op.id.compare(this.last.id) > 0)
      this.last = op;
  }

  public toValue(): LogicalTimestamp {
    const {last} = this;
    return last ? last.value : UNDEFINED_ID;
  }
}
