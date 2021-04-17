import type {IJsonCrdtPatchOperation} from './types';
import type {ITimestamp} from '../clock';

export class MakeArrayOperation implements IJsonCrdtPatchOperation {
  constructor(public readonly id: ITimestamp) {}

  public span(): number {
    return 1;
  }

  public getMnemonic(): string {
    return 'arr';
  }
}
