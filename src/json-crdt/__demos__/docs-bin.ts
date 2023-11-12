/* tslint:disable no-console */

/**
 * Run this demo with:
 *
 *     npx nodemon -q -x ts-node src/json-crdt/__demos__/docs-bin.ts
 */

import {Model} from '..';

console.clear();

const model = Model.withLogicalClock(1234); // 1234 is session ID

model.api.root({
  blob: new Uint8Array([1, 2, 3]),
});

console.log(model.view());
// { blob: Uint8Array(3) [ 1, 2, 3 ] }

console.log(model.root + '');
// RootNode 0.0
// └─ ObjNode 1234.1
//    └─ "blob"
//        └─ BinNode 1234.2  { 1, 2, 3 }
//           └─ BinChunk 1234.3!3 len:3 { 1, 2, 3 }

// Retrieve node at path ['blob'] as "bin" type.
const blob = model.api.bin(['blob']);
console.log(blob + '');
// BinApi
// └─ BinNode 1234.2  { 1, 2, 3 }
//    └─ BinChunk 1234.3!3 len:3 { 1, 2, 3 }

blob.ins(3, new Uint8Array([4, 5]));
console.log(blob + '');
// BinApi
// └─ BinNode 1234.2  { 1, 2, 3, 4, 5 }
//    └─ BinChunk 1234.8!2 len:5 { 4, 5 }
//       ← BinChunk 1234.3!3 len:3 { 1, 2, 3 }

blob.del(2, 1);
console.log(blob + '');
// BinApi
// └─ BinNode 1234.2  { 1, 2, 4, 5 }
//    └─ BinChunk 1234.8!2 len:4 { 4, 5 }
//       ← BinChunk 1234.3!2 len:2 { 1, 2 }
//         → BinChunk 1234.5!1 len:0 [1]

console.log(model.view());
// { blob: Uint8Array(4) [ 1, 2, 4, 5 ] }