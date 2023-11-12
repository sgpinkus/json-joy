import {Timestamp} from '../../../json-crdt-patch/clock';
import {StrNode} from '../../nodes';
import {Model} from '../../model';
import {Doc} from 'diamond-types-node';
import * as Y from 'yjs';
import Yrs from 'ywasm';
import * as Automerge from '@automerge/automerge';
import {CRuntime, CText} from '@collabs/collabs';
import type {SequentialTraceEditor} from './types';
const AutomergeUnstable = require('@automerge/automerge/dist/cjs/unstable');
const Rope = require('rope.js');

const editorStrNode: SequentialTraceEditor = {
  name: 'StrNode (json-joy)',
  factory: () => {
    let time = 0;
    const rga = new StrNode(new Timestamp(1, time++));
    return {
      ins: (pos: number, insert: string) => {
        rga.insAt(pos, new Timestamp(1, time), insert);
        time += insert.length;
      },
      del: (pos: number, len: number) => {
        rga.delete(rga.findInterval(pos, len));
      },
      get: () => rga.view(),
      len: () => rga.length(),
      chunks: () => rga.size(),
    };
  },
};

const editorJsonJoy: SequentialTraceEditor = {
  name: 'json-joy',
  factory: () => {
    const model = Model.withLogicalClock();
    model.api.root('');
    const str = model.api.str([]);
    return {
      ins: (pos: number, insert: string) => {
        str.ins(pos, insert);
      },
      del: (pos: number, len: number) => {
        str.del(pos, len);
      },
      get: () => str.view(),
      len: () => str.view().length,
      chunks: () => str.node.size(),
      toBlob: () => model.toBinary(),
    };
  },
};

const editorYjs: SequentialTraceEditor = {
  name: 'Y.js',
  factory: () => {
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText();
    return {
      ins: (pos: number, insert: string) => {
        ytext.insert(pos, insert);
      },
      del: (pos: number, len: number) => {
        ytext.delete(pos, len);
      },
      get: () => ytext.toString(),
      len: () => ytext.toString().length,
      chunks: () => {
        let cnt = 0;
        let curr = ytext._start;
        while (curr) {
          cnt++;
          curr = curr.right;
        }
        return cnt;
      },
      toBlob: () => Y.encodeStateAsUpdate(ydoc),
    };
  },
};

const editorYrs: SequentialTraceEditor = {
  name: 'Y.rs',
  factory: () => {
    const ydoc = new Yrs.YDoc({});
    const ytext = ydoc.getText('test');
    return {
      ins: (pos: number, insert: string) => {
        ytext.insert(pos, insert, undefined);
      },
      del: (pos: number, len: number) => {
        ytext.delete(pos, len);
      },
      get: () => ytext.toString(),
      len: () => ytext.toString().length,
      chunks: () => 0,
      toBlob: () => Yrs.encodeStateAsUpdate(ydoc),
    };
  },
};

const editorAutomerge: SequentialTraceEditor = {
  name: 'Automerge',
  factory: () => {
    let doc = Automerge.init();
    doc = Automerge.change(doc, (doc) => {
      (<any>doc).text = new Automerge.Text();
    });
    return {
      ins: (pos: number, insert: string) => {
        doc = Automerge.change(doc, (doc) => {
          (<any>doc).text.insertAt(pos, ...insert.split(''));
        });
      },
      del: (pos: number, len: number) => {
        doc = Automerge.change(doc, (doc) => {
          (<any>doc).text.deleteAt(pos, len);
        });
      },
      get: () => (doc as any).text + '',
      len: () => (doc as any).text.length,
      chunks: () => (doc as any).text.elems.length,
      toBlob: () => Automerge.save(doc),
    };
  },
};

const editorAutomergeUnstable: SequentialTraceEditor = {
  name: 'AutomergeUnstable',
  factory: () => {
    let doc = AutomergeUnstable.from({text: ''});
    return {
      ins: (pos: number, insert: string) => {
        doc = AutomergeUnstable.change(doc, (doc: any) => {
          AutomergeUnstable.splice(doc, 'text', pos, 0, insert);
        });
      },
      del: (pos: number, len: number) => {
        doc = AutomergeUnstable.change(doc, (doc: any) => {
          AutomergeUnstable.splice(doc, 'text', pos, len);
        });
      },
      get: () => AutomergeUnstable.toJS(doc).text,
      len: () => AutomergeUnstable.toJS(doc).text.length,
      chunks: () => 0,
      toBlob: () => AutomergeUnstable.save(doc),
    };
  },
};

const editorCollabs: SequentialTraceEditor = {
  name: 'collabs',
  factory: () => {
    const doc = new CRuntime();
    const text: CText = doc.registerCollab('text', (init) => new CText(init));
    return {
      ins: (pos: number, insert: string) => {
        doc.transact(() => {
          text.insert(pos, insert);
        });
      },
      del: (pos: number, len: number) => {
        doc.transact(() => {
          text.delete(pos, len);
        });
      },
      get: () => text.toString(),
      len: () => text.toString().length,
      chunks: () => 0,
      toBlob: () => doc.save(),
    };
  },
};

const editorDiamondTypesNode: SequentialTraceEditor = {
  name: 'diamond-types-node',
  factory: () => {
    const doc = new Doc('seph');
    return {
      ins: (pos: number, insert: string) => {
        doc.ins(pos, insert);
      },
      del: (pos: number, len: number) => {
        doc.del(pos, len);
      },
      get: () => doc.get(),
      len: () => doc.get().length,
      chunks: () => 0,
      toBlob: () => doc.toBytes(),
    };
  },
};

const editorV8Strings: SequentialTraceEditor = {
  name: 'V8 strings',
  factory: () => {
    let str = '';
    return {
      ins: (pos: number, insert: string) => {
        str = str.slice(0, pos) + insert + str.slice(pos);
      },
      del: (pos: number, len: number) => {
        str = str.slice(0, pos) + str.slice(pos + len);
      },
      get: () => str,
      len: () => str.length,
      chunks: () => 0,
    };
  },
};

const editorRopeJs: SequentialTraceEditor = {
  name: 'rope.js',
  factory: () => {
    const r = new Rope(['']);
    return {
      ins: (pos: number, insert: string) => {
        r.splice(pos, 0, insert);
      },
      del: (pos: number, len: number) => {
        r.splice(pos, len, '');
      },
      get: () => r.toString(),
      len: () => r.toString().length,
      chunks: () => r.segs.length,
    };
  },
};

export const editors = {
  'StrNode (json-joy)': editorStrNode,
  'json-joy': editorJsonJoy,
  'Y.js': editorYjs,
  'Y.rs': editorYrs,
  Automerge: editorAutomerge,
  AutomergeUnstable: editorAutomergeUnstable,
  collabs: editorCollabs,
  'diamond-types-node': editorDiamondTypesNode,
  'V8 strings': editorV8Strings,
  'rope.js': editorRopeJs,
};

export type SequentialEditorName = keyof typeof editors;