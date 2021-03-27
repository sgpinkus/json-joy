import {Document} from '../document';

test('can edit strings', () => {
  const doc = new Document();
  const changes = doc.changes;
  changes.root('');
  changes.strIns([], 0, 'var foo = bar');
  changes.strIns([], 9, '"');
  changes.strIns([], 13, '";');
  changes.strDel([], 0, 3);
  changes.strIns([], 0, 'const');
  expect(doc.toJson()).toBe('const foo = "bar";');
});

test('can edit strings - 2', () => {
  const doc = new Document();
  const changes = doc.changes;
  changes.root({foo: [123, '', 5]});
  changes.strIns(['foo', 1], 0, 'var foo = bar');
  changes.strIns(['foo', 1], 9, '"');
  changes.strIns(['foo', 1], 13, '";');
  changes.strDel(['foo', 1], 0, 3);
  changes.strIns(['foo', 1], 0, 'const');
  expect(doc.toJson()).toEqual({
    foo: [123, 'const foo = "bar";', 5],
  });
});
