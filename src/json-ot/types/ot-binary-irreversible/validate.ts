import type {BinaryOp, BinaryOpComponent} from './types';

export const enum VALIDATE_RESULT {
  SUCCESS = 0,
  INVALID_OP,
  INVALID_COMPONENT,
  ADJACENT_SAME_TYPE,
  NO_TRAILING_RETAIN,
}

export const validate = (op: BinaryOp): VALIDATE_RESULT => {
  if (!(op instanceof Array)) return VALIDATE_RESULT.INVALID_OP;
  if (op.length === 0) return VALIDATE_RESULT.INVALID_OP;
  let last: BinaryOpComponent | undefined;
  for (let i = 0; i < op.length; i++) {
    const component = op[i];
    if (typeof component === 'number') {
      if (!component) return VALIDATE_RESULT.INVALID_COMPONENT;
      if (component !== Math.round(component)) return VALIDATE_RESULT.INVALID_COMPONENT;
      if (component > 0) {
        const lastComponentIsRetain = typeof last === 'number' && last > 0;
        if (lastComponentIsRetain) return VALIDATE_RESULT.ADJACENT_SAME_TYPE;
      } else {
        const lastComponentIsDelete = typeof last === 'number' && last < 0;
        if (lastComponentIsDelete) return VALIDATE_RESULT.ADJACENT_SAME_TYPE;
      }
    } else if (component instanceof Uint8Array) {
      if (!component.length) return VALIDATE_RESULT.INVALID_COMPONENT;
      const lastComponentIsInsert = last instanceof Uint8Array;
      if (lastComponentIsInsert) return VALIDATE_RESULT.ADJACENT_SAME_TYPE;
    } else {
      return VALIDATE_RESULT.INVALID_COMPONENT;
    }
    last = component;
  }
  const isLastRetain = typeof last === 'number' && last > 0;
  if (isLastRetain) return VALIDATE_RESULT.NO_TRAILING_RETAIN;
  return VALIDATE_RESULT.SUCCESS;
};
