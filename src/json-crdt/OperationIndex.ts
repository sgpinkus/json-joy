import {LogicalTimestamp} from './clock';
import {ICrdtOperation} from './operations/types';

export class OperationIndex {
  /**
   * An index of all operations in this document accessible by operation ID.
   * 
   *     (sessionId, time) -> operation
   */
   public operations: Map<number, Map<number, ICrdtOperation>> = new Map();

  /**
   * Retrieve any known operation in this document by its ID. Or, if operation,
   * is composed of multiple operations (op.span > 1), still retrieve that operation
   * if the actual ID is inside the operation.
   */
  public get(id: LogicalTimestamp): undefined | ICrdtOperation {
    const {sessionId, time} = id;
    const map1 = this.operations;
    const map2 = map1.get(sessionId);
    if (!map2) return undefined;
    const operation = map2.get(time);
    if (operation) return operation;
    for (const operation of map2.values()) {
      const operationTime = operation.id.time;
      if ((operationTime < time) && (operationTime + (operation.span || 1) - 1 >= time))
        return operation;
    }
    return undefined;
  }

  /**
   * Index an operation in the global operation index of this document.
   */
  public index(operation: ICrdtOperation) {
    const {sessionId, time} = operation.id;
    let map = this.operations.get(operation.id.sessionId);
    if (!map) {
      map = new Map<number, ICrdtOperation>();
      this.operations.set(sessionId, map);
    }
    map.set(time, operation);
  }
}
