import {
  Kit,
  setupAlphabetChunkSplitKit,
  setupAlphabetKit,
  setupAlphabetWithDeletesKit,
  setupAlphabetWithTwoChunksKit,
} from '../../__tests__/setup';

const runTests = (setup: () => Kit) => {
  test('updates block hash only where something was changed - leading block', () => {
    const {editor, peritext} = setup();
    editor.cursor.setAt(10);
    editor.saved.insMarker(['p'], 'p1');
    editor.cursor.setAt(22);
    editor.saved.insMarker(['p'], 'p2');
    editor.cursor.setAt(editor.txt.str.length());
    peritext.refresh();
    const rootHash1 = peritext.blocks.root.hash;
    const firstBlockHash1 = peritext.blocks.root.children[0].hash;
    const secondBlockHash1 = peritext.blocks.root.children[1].hash;
    editor.cursor.setAt(2);
    editor.insert('___');
    peritext.refresh();
    const rootHash2 = peritext.blocks.root.hash;
    const firstBlockHash2 = peritext.blocks.root.children[0].hash;
    const secondBlockHash2 = peritext.blocks.root.children[1].hash;
    expect(rootHash1).not.toBe(rootHash2);
    expect(firstBlockHash1).not.toBe(firstBlockHash2);
    expect(secondBlockHash1).toBe(secondBlockHash2);
  });

  test('updates block hash only where hash has changed - middle block', () => {
    const {editor, peritext} = setup();
    editor.cursor.setAt(10);
    editor.saved.insMarker(['p', 'p1']);
    editor.cursor.setAt(22);
    editor.saved.insMarker(['p'], 'p2');
    peritext.refresh();
    const rootHash1 = peritext.blocks.root.hash;
    const firstBlockHash1 = peritext.blocks.root.children[0].hash;
    const secondBlockHash1 = peritext.blocks.root.children[1].hash;
    editor.cursor.setAt(13);
    editor.insert('___');
    peritext.refresh();
    const rootHash2 = peritext.blocks.root.hash;
    const firstBlockHash2 = peritext.blocks.root.children[0].hash;
    const secondBlockHash2 = peritext.blocks.root.children[1].hash;
    expect(rootHash1).not.toBe(rootHash2);
    expect(firstBlockHash1).toBe(firstBlockHash2);
    expect(secondBlockHash1).not.toBe(secondBlockHash2);
  });
};

describe('Blocks.refresh()', () => {
  describe('basic alphabet', () => {
    runTests(setupAlphabetKit);
  });

  describe('alphabet with two chunks', () => {
    runTests(setupAlphabetWithTwoChunksKit);
  });

  describe('alphabet with chunk split', () => {
    runTests(setupAlphabetChunkSplitKit);
  });

  describe('alphabet with deletes', () => {
    runTests(setupAlphabetWithDeletesKit);
  });
});
