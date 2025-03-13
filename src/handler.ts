import {ApiRes} from './api-res';
import type {RequestHandler, Response} from 'express';
import type {
  Handler,
  ReqHandler,
  Constructor,
  ProxyWrapper,
  WrappedMethods,
} from './types';

/**
 * Processes the result of a route handler and sends the appropriate response.
 *
 * @param {unknown} result - The result of the handler, either an ApiRes instance or any other value.
 * @param {Response} res - The Express response object.
 */
const handleResult = (result: unknown, res: Response): void => {
  if (result instanceof ApiRes) {
    // Send status and JSON if result is ApiRes
    res.status(result.status).json(result.toJson());
  } else if (result && result !== res) {
    // Send non-ApiRes result directly
    res.send(result);
  }
};

/**
 * Wraps an async route handler to manage errors and response handling.
 *
 * @param {ReqHandler} func - The route handler, which can return a value or a Promise.
 * @returns {ReqHandler} - A wrapped handler with error and result handling.
 *
 * @example
 * // without type
 * app.get('/example', handler(async (req, res) => await fetchData()));
 * // with type
 * type ExampleHandler = Handler<{name: string}>
 * app.get('/example', handler<ExampleHandler>(async (req, res) => await fetchData(req.body.name)));
 */
export const handler =
  <T extends Handler<any, any, any>>(
    func: ReqHandler<T['body'], T['param'], T['query']>,
  ): RequestHandler =>
  (req, res, next) => {
    try {
      const result = func(req, res, next);
      if (result instanceof Promise) {
        // Handle async results
        result.then(value => handleResult(value, res)).catch(next);
      } else {
        // Handle sync results
        handleResult(result, res);
      }
    } catch (error) {
      next(error);
    }
  };

// Overload signatures
export const proxyWrapper: ProxyWrapper = <T extends object>(
  clsOrInstance: Constructor<T> | T,
  ...args: ConstructorParameters<Constructor<T>> | []
): WrappedMethods<T> => {
  // Create an instance if clsOrInstance is a constructor
  const instance =
    typeof clsOrInstance === 'function'
      ? new clsOrInstance(...args)
      : clsOrInstance;

  return new Proxy(instance, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      return typeof value === 'function' ? handler(value.bind(target)) : value;
    },
    set() {
      throw new Error('Overriding methods and properties is not allowed.');
    },
  }) as WrappedMethods<T>;
};
