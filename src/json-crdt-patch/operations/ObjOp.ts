import type {IJsonCrdtPatchOperation} from './types';
import {ITimestampStruct, toDisplayString} from '../clock';

/**
 * Operation which creates a new object.
 */
export class ObjOp implements IJsonCrdtPatchOperation {
  constructor(public readonly id: ITimestampStruct) {}

  public span(): number {
    return 1;
  }

  public name(): string {
    return 'obj';
  }

  public toString(): string {
    return `"${this.name()}" ${toDisplayString(this.id)}`;
  }
}