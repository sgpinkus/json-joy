import {t} from '..';

test('can generate a type', () => {
  const address = t.Object({
    title: 'User address',
    description: 'Various address fields for user',
    fields: [
      t.Field('street', t.String()),
      t.Field('zip', t.String()),
    ],
  });
  const userType = t.Object([
    t.Field('id', t.Number({format: 'i'})),
    t.Field('alwaysOne', t.Number({const: 1})),
    t.Field('name', t.String()),
    t.Field('address', address),
    t.Field('timeCreated', t.Number()),
    t.Field('tags', t.Array(t.Or(t.Number(), t.String()))),
  ]);

  expect(userType).toMatchObject({
    "__t": "obj",
    "fields": [
      {
        "key": "id",
        "type": {
          "__t": "num",
          "format": "i",
        }
      },
      {
        "key": "alwaysOne",
        "type": {
          "__t": "num",
          "const": 1
        }
      },
      {
        "key": "name",
        "type": {
          "__t": "str"
        }
      },
      {
        "key": "address",
        "type": {
          "__t": "obj",
          "title": "User address",
          "description": "Various address fields for user",
          "fields": [
            {
              "key": "street",
              "type": {
                "__t": "str"
              }
            },
            {
              "key": "zip",
              "type": {
                "__t": "str"
              }
            }
          ]
        }
      },
      {
        "key": "timeCreated",
        "type": {
          "__t": "num"
        }
      },
      {
        "key": "tags",
        "type": {
          "__t": "arr",
          "type": {
            "__t": "or",
            "types": [
              {
                "__t": "num"
              },
              {
                "__t": "str"
              }
            ]
          }
        }
      }
    ]
  });
});
