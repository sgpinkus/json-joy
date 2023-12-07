import {t} from '..';
import {Discriminator} from '../discriminator';

test('can find const discriminator at root node', () => {
  const t1 = t.Const('foo');
  const t2 = t.Const(123);
  const t3 = t.Const([true, false]);
  const d1 = Discriminator.find(t1);
  const d2 = Discriminator.find(t2);
  const d3 = Discriminator.find(t3);
  expect(d1!.toSpecifier()).toBe('["","const","foo"]');
  expect(d2!.toSpecifier()).toBe('["","const",123]');
  expect(d3!.toSpecifier()).toBe('["","const",[true,false]]');
});

test('can find const discriminator in a tuple', () => {
  const t1 = t.Tuple(t.Const('foo'));
  const t2 = t.Tuple(t.Const('add'), t.str, t.any);
  const t3 = t.Tuple(t.map, t.obj, t.Const(null), t.num);
  const d1 = Discriminator.find(t1);
  const d2 = Discriminator.find(t2);
  const d3 = Discriminator.find(t3);
  expect(d1!.toSpecifier()).toBe('["/0","const","foo"]');
  expect(d2!.toSpecifier()).toBe('["/0","const","add"]');
  expect(d3!.toSpecifier()).toBe('["/2","const",null]');
});

test('can find const discriminator in a object', () => {
  const t1 = t.Object(
    t.prop('op', t.Const('replace')),
    t.prop('value', t.num),
    t.prop('path', t.str),
  );
  const d1 = Discriminator.find(t1);
  expect(d1!.toSpecifier()).toBe('["/op","const","replace"]');
});

test('uses node type as discriminator, if not const', () => {
  const t1 = t.Map(t.str);
  const t2 = t.obj;
  const t3 = t.str;
  const d1 = Discriminator.find(t1);
  const d2 = Discriminator.find(t2);
  const d3 = Discriminator.find(t3);
  expect(d1!.toSpecifier()).toBe('["","map",0]');
  expect(d2!.toSpecifier()).toBe('["","obj",0]');
  expect(d3!.toSpecifier()).toBe('["","str",0]');
});

test('can find const node in nested fields', () => {
  const t1 = t.Tuple(t.str, t.Tuple(t.num, t.Const('foo')));
  const t2 = t.Object(
    t.prop('type', t.Tuple(t.Const(25), t.str, t.any)),
    t.prop('value', t.num),
  );
  const d1 = Discriminator.find(t1);
  const d2 = Discriminator.find(t2);
  // const d3 = Discriminator.find(t3);
  expect(d1!.toSpecifier()).toBe('["/1/1","const","foo"]');
  expect(d2!.toSpecifier()).toBe('["/type/0","const",25]');
});
