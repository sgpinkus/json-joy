import type * as types from '../../nodes';
import type * as nodes from './nodes';

// prettier-ignore
export type JsonNodeApi<N> = N extends types.ConNode<any>
  ? nodes.ConApi<N>
  : N extends types.RootLww<any>
    ? nodes.ValApi<N>
    : N extends types.ValNode<any>
      ? nodes.ValApi<N>
      : N extends types.StringRga
        ? nodes.StringApi
        : N extends types.BinaryRga
          ? nodes.BinaryApi
          : N extends types.ArrayRga<any>
            ? nodes.ArrayApi<N>
            : N extends types.ObjectLww<any>
              ? nodes.ObjectApi<N>
              : N extends types.ArrayLww<any>
                ? nodes.VectorApi<N>
                : never;
