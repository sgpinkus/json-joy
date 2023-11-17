import {routes} from './routes';
import {TypeSystem} from '../../json-type';
import {TypeRouter} from '../../json-type/system/TypeRouter';
import {TypeRouterCaller} from '../../reactive-rpc/common/rpc/caller/TypeRouterCaller';
import {RpcError} from '../../reactive-rpc/common/rpc/caller';
import type {Services} from '../services/Services';
import type {RouteDeps} from './types';
import {Value} from '../../reactive-rpc/common/messages/Value';

export const createRouter = (services: Services) => {
  const system = new TypeSystem();
  const router = new TypeRouter({system, routes: {}});
  const deps: RouteDeps = {services, router};
  return routes(deps)(router);
};

export const createCaller = (services: Services) => {
  const router = createRouter(services);
  const caller = new TypeRouterCaller<typeof router>({
    router,
    wrapInternalError: (error: unknown) => {
      if (error instanceof Value) return error;
      if (error instanceof RpcError) return RpcError.value(error);
      // tslint:disable-next-line:no-console
      console.error(error);
      return RpcError.valueFrom(error);
    },
  });
  return caller;
};
