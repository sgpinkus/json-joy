import {Expr, JsonExpressionCodegenContext} from '../types';

export type Check = (
  expression: Expr,
  expected: unknown,
  data?: unknown,
  options?: JsonExpressionCodegenContext,
) => void;

export const jsonExpressionUnitTests = (
  check: Check,
  {skipOperandArityTests}: {skipOperandArityTests?: boolean} = {},
) => {
  describe('Arithmetic operators', () => {
    describe('add or +', () => {
      test('can add numbers', () => {
        check(['add', 1, 2], 3);
        check(['+', 1, 2], 3);
      });

      test('evaluates sub-expressions', () => {
        check(['add', 1, ['add', 1, 1]], 3);
        check(['+', 1, ['+', 1, 1]], 3);
      });

      test('is variadic', () => {
        check(['add', 1, 1, 1, 1], 4);
        check(['+', 1, 2, 3, 4], 10);
      });

      test('casts strings to numbers', () => {
        check(['add', '2', '2'], 4);
        check(['+', '1', '10.5'], 11.5);
      });

      test('throws on too few arguments', () => {
        expect(() => check(['add', 1], 2)).toThrowErrorMatchingInlineSnapshot(
          `""+" operator expects at least two operands."`,
        );
        expect(() => check(['+', 1], 2)).toThrowErrorMatchingInlineSnapshot(
          `""+" operator expects at least two operands."`,
        );
      });
    });

    describe('subtract or -', () => {
      test('two operands', () => {
        check(['subtract', 1, 2], -1);
        check(['-', 1, 2], -1);
      });

      test('evaluates sub-expressions', () => {
        check(['subtract', 1, ['subtract', 1, 1]], 1);
        check(['-', 1, ['-', 1, 1]], 1);
      });

      test('is variadic', () => {
        check(['subtract', 1, 1, 1, 1], -2);
        check(['-', 1, 2, 3, 4], -8);
      });

      test('casts strings to numbers', () => {
        check(['subtract', '2', '2'], 0);
        check(['-', '1', '10.5'], -9.5);
      });

      test('throws on too few arguments', () => {
        expect(() => check(['subtract', 1], 2)).toThrowErrorMatchingInlineSnapshot(
          `""-" operator expects at least two operands."`,
        );
        expect(() => check(['-', 1], 2)).toThrowErrorMatchingInlineSnapshot(
          `""-" operator expects at least two operands."`,
        );
      });
    });

    describe('multiply or *', () => {
      test('two operands', () => {
        check(['multiply', 1, 2], 2);
        check(['*', 3, 2], 6);
      });

      test('evaluates sub-expressions', () => {
        check(['multiply', 1, ['multiply', 1, 1]], 1);
        check(['*', 0.5, ['*', 4, 4]], 8);
      });

      test('is variadic', () => {
        check(['multiply', 2, 2, 2, 2], 16);
        check(['*', 1, 2, 3, 4], 24);
      });

      test('casts strings to numbers', () => {
        check(['multiply', '2', '2'], 4);
        check(['*', '1', '10.5'], 10.5);
      });

      test('throws on too few arguments', () => {
        expect(() => check(['multiply', 1], 2)).toThrowErrorMatchingInlineSnapshot(
          `""*" operator expects at least two operands."`,
        );
        expect(() => check(['*', 1], 2)).toThrowErrorMatchingInlineSnapshot(
          `""*" operator expects at least two operands."`,
        );
      });
    });

    describe('divide or /', () => {
      test('two operands', () => {
        check(['divide', 1, 2], 0.5);
        check(['/', 3, 2], 1.5);
      });

      test('evaluates sub-expressions', () => {
        check(['divide', 1, ['divide', 4, 2]], 0.5);
        check(['/', 0.5, ['/', 4, 4]], 0.5);
      });

      test('is variadic', () => {
        check(['divide', 2, 2, 2, 2], 0.25);
        check(['/', 32, 2, 4, ['+', 1, 1]], 2);
      });

      test('casts strings to numbers', () => {
        check(['divide', '4', '2'], 2);
        check(['/', '1', '10'], 0.1);
      });

      test('throws on too few arguments', () => {
        expect(() => check(['divide', 1], 2)).toThrowErrorMatchingInlineSnapshot(
          `""/" operator expects at least two operands."`,
        );
        expect(() => check(['/', 1], 2)).toThrowErrorMatchingInlineSnapshot(
          `""/" operator expects at least two operands."`,
        );
      });

      test('throws throws when dividing by zero', () => {
        expect(() => check(['divide', 1, 0], 0)).toThrowErrorMatchingInlineSnapshot(`"DIVISION_BY_ZERO"`);
        expect(() => check(['/', ['+', 1, 1], 0], 0)).toThrowErrorMatchingInlineSnapshot(`"DIVISION_BY_ZERO"`);
      });
    });

    describe('divide or %', () => {
      test('two operands', () => {
        check(['mod', 1, 2], 1);
        check(['%', 3, 2], 1);
      });

      test('evaluates sub-expressions', () => {
        check(['mod', 3, ['mod', 4, 3]], 0);
        check(['%', 5, ['%', 7, 5]], 1);
      });

      test('is variadic', () => {
        check(['mod', 13, 7, 4, 2], 0);
        check(['%', 32, 25, 4, ['%', 5, 3]], 1);
      });

      test('casts strings to numbers', () => {
        check(['mod', '4', '2'], 0);
        check(['%', '1', '10'], 1);
      });

      test('throws on too few arguments', () => {
        expect(() => check(['mod', 1], 2)).toThrowErrorMatchingInlineSnapshot(
          `""%" operator expects at least two operands."`,
        );
        expect(() => check(['%', 1], 2)).toThrowErrorMatchingInlineSnapshot(
          `""%" operator expects at least two operands."`,
        );
      });

      test('throws throws when dividing by zero', () => {
        expect(() => check(['mod', 1, 0], 0)).toThrowErrorMatchingInlineSnapshot(`"DIVISION_BY_ZERO"`);
        expect(() => check(['%', ['+', 1, 1], 0], 0)).toThrowErrorMatchingInlineSnapshot(`"DIVISION_BY_ZERO"`);
      });
    });

    describe('min', () => {
      test('two operands', () => {
        check(['min', 1, 2], 1);
      });

      test('evaluates sub-expressions', () => {
        check(['min', 5, ['min', 4, 3]], 3);
      });

      test('is variadic', () => {
        check(['min', 13, 7, 4, 2], 2);
      });

      test('casts strings to numbers', () => {
        check(['min', '4', '2'], 2);
      });
    });

    describe('max', () => {
      test('two operands', () => {
        check(['max', 1, 2], 2);
      });

      test('evaluates sub-expressions', () => {
        check(['max', 5, ['max', 4, 3]], 5);
      });

      test('is variadic', () => {
        check(['max', 13, 7, 4, 2], 13);
      });

      test('casts strings to numbers', () => {
        check(['max', '4', '2'], 4);
      });
    });
  });
};
