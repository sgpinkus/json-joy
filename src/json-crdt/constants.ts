import {LogicalTimestamp} from './clock';
import {CrdtType, JsonNode} from './types';

export class ConstantType implements CrdtType, JsonNode {
  public readonly span = 1;

  constructor (public readonly id: LogicalTimestamp, public readonly value: unknown) {}

  insert() {}
  merge() {}

  public toJson() {
    return this.value;
  }
}

/**
 * Represents some sort of root element or is simply the bottom value of a
 * logical timestamp.
 */
export const SINGULARITY = new LogicalTimestamp(0, 0);
export const NULL_ID = new LogicalTimestamp(0, 1);
export const TRUE_ID = new LogicalTimestamp(0, 2);
export const FALSE_ID = new LogicalTimestamp(0, 3);
export const UNDEFINED_ID = new LogicalTimestamp(0, 4);


export const NULL = new ConstantType(NULL_ID, null);
export const TRUE = new ConstantType(TRUE_ID, true);
export const FALSE = new ConstantType(FALSE_ID, false);
