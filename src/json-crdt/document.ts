import type {JsonNode} from './types';
import {FALSE, NULL, TRUE} from './constants';
import {IdentifiableIndex} from './IdentifiableIndex';
import {random40BitInt} from './util';
import {Patch} from '../json-crdt-patch/Patch';
import {SetRootOperation} from '../json-crdt-patch/operations/SetRootOperation';
import {LogicalClock} from '../json-crdt-patch/clock';
import {DocRootType} from './lww-register-doc-root/DocRootType';
import {MakeObjectOperation} from '../json-crdt-patch/operations/MakeObjectOperation';
import {LWWObjectType} from './lww-object/LWWObjectType';
import {SetObjectKeysOperation} from '../json-crdt-patch/operations/SetObjectKeysOperation';
import {MakeNumberOperation} from '../json-crdt-patch/operations/MakeNumberOperation';
import {LWWNumberType} from './lww-number/LWWNumberType';
import {SetNumberOperation} from '../json-crdt-patch/operations/SetNumberOperation';
import {MakeArrayOperation} from '../json-crdt-patch/operations/MakeArrayOperation';
import {ArrayType} from './rga-array/ArrayType';
import {InsertArrayElementsOperation} from '../json-crdt-patch/operations/InsertArrayElementsOperation';
import {ORIGIN} from '../json-crdt-patch/constants';
import {DeleteOperation} from '../json-crdt-patch/operations/DeleteOperation';

export class Document {
  /**
   * Root of the JSON document is implemented as Last Write Wins Register,
   * so that the JSON document does not necessarily need to be an object. The
   * JSON document can be any JSON value.
   */
  public root = new DocRootType(ORIGIN);

  /**
   * Clock that keeps track of logical timestamps of the current editing session.
   */
  public clock: LogicalClock;

  /**
   * Index of all known JSON nodes (objects, array, strings, numbers) in this document.
   */
  public nodes = new IdentifiableIndex<JsonNode>();

  constructor(sessionId: number = random40BitInt()) {
    this.clock = new LogicalClock(sessionId, 0);
    this.nodes.index(NULL);
    this.nodes.index(TRUE);
    this.nodes.index(FALSE);
  }

  public applyPatch(patch: Patch) {
    for (const op of patch.ops) {
      if (op instanceof MakeObjectOperation) {
        const exists = !!this.nodes.get(op.id);
        if (exists) return; // We can return, because all remaining ops in the patch will already exist, too.
        const obj = new LWWObjectType(this, op.id);
        this.nodes.index(obj);
        continue;
      }
      if (op instanceof MakeArrayOperation) {
        const exists = !!this.nodes.get(op.id);
        if (exists) return;
        const obj = new ArrayType(this, op.id);
        this.nodes.index(obj);
        continue;
      }
      if (op instanceof MakeNumberOperation) {
        const exists = !!this.nodes.get(op.id);
        if (exists) return;
        const num = new LWWNumberType(op.id, 0);
        this.nodes.index(num);
        continue;
      }
      if (op instanceof SetRootOperation) {
        this.root.insert(op);
        continue;
      }
      if (op instanceof SetObjectKeysOperation) {
        const obj = this.nodes.get(op.object);
        if (!(obj instanceof LWWObjectType)) continue;
        obj.insert(op);
        continue;
      }
      if (op instanceof SetNumberOperation) {
        const num = this.nodes.get(op.num);
        if (!(num instanceof LWWNumberType)) continue;
        num.insert(op);
        continue;
      }
      if (op instanceof InsertArrayElementsOperation) {
        const arr = this.nodes.get(op.arr);
        if (!(arr instanceof ArrayType)) continue;
        arr.insert(op);
        continue;
      }
      if (op instanceof DeleteOperation) {
        const node = this.nodes.get(op.obj);
        if (node instanceof ArrayType) {
          node.delete(op);
        }
        continue;
      }
    }
  }

  public toJson(): unknown {
    const value = this.root.toValue();
    const op = this.nodes.get(value);
    if (!op) return undefined;
    return op.toJson();
  }
}
