import type {HttpStatus} from './enums';
import type {Request, Response, NextFunction, RequestHandler} from 'express';

/** Extracts the value type of an object */
export type ValueOf<T> = T[keyof T];

/** Filters out only number types from a union */
export type NumberOf<K> = Extract<K, number>;

// Define a type for HttpStatus that only includes number values
export type HttpStatusNumber = NumberOf<ValueOf<typeof HttpStatus>>;

// Define the type for the body message of HTTP errors
export type BodyMessage = string | string[];

// Define the structure of the HTTP error body
export interface HttpErrorBody {
  error: string; // Error message
  detail?: any; // Optional detailed information about the error
  status: number; // HTTP status code
  message: BodyMessage; // Message describing the error
}

// Define the structure of the HTTP response body
export interface HttpResBody {
  status: number; // HTTP status code
  message: string; // Response message
  result: any; // The result of the request
}

// Define a reusable type for handler props
export type Handler<B = unknown, P = unknown, Q = unknown> = {
  body: B;
  param: P;
  query: Q;
};

// Define the type for request handler functions
export type ReqHandler<B = any, P = any, Q = any> = (
  req: Request<P, any, B, Q>,
  res: Response,
  next: NextFunction,
) => any | Promise<any>;

// Define a constructor type for classes
export type Constructor<T> = new (...args: any[]) => T;

// Define a type that wraps methods of a class with request handlers
export type WrappedMethods<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? RequestHandler // If the method is a function, wrap it with ReqHandler
    : T[K]; // Otherwise, keep the original type
};

// Define the ProxyWrapper type
export type ProxyWrapper = {
  /**
   * Wraps a class constructor in a Proxy, allowing all methods to be
   * automatically wrapped with `asyncHandler`.
   *
   * @param clsOrInstance - The class constructor.
   * @returns A proxied instance where all methods are wrapped with `asyncHandler`.
   *
   * @example
   * class MyClass {
   *   async myMethod() {
   *     return 'Hello, World!';
   *   }
   * }
   * const proxiedInstance = proxyWrapper(MyClass);
   * await proxiedInstance.myMethod(); // Automatically wrapped with asyncHandler
   */
  <T extends object>(clsOrInstance: Constructor<T>): WrappedMethods<T>;

  /**
   * Wraps an instance of a class in a Proxy, allowing all methods to be
   * automatically wrapped with `asyncHandler`.
   *
   * @param clsOrInstance - An instance of the class.
   * @returns A proxied instance where all methods are wrapped with `asyncHandler`.
   *
   * @example
   * class MyClass {
   *   async myMethod() {
   *     return 'Hello, World!';
   *   }
   * }
   * const instance = new MyClass();
   * const proxiedInstance = proxyWrapper(instance);
   * await proxiedInstance.myMethod(); // Automatically wrapped with asyncHandler
   */
  <T extends object>(clsOrInstance: T): WrappedMethods<T>;

  /**
   * Wraps a class constructor in a Proxy, allowing all methods to be
   * automatically wrapped with `asyncHandler`, with constructor arguments.
   *
   * @param clsOrInstance - The class constructor.
   * @param args - The arguments for the class constructor.
   * @returns A proxied instance where all methods are wrapped with `asyncHandler`.
   *
   * @example
   * class MyClass {
   *   constructor(private name: string) {}
   *   async greet() {
   *     return `Hello, ${this.name}!`;
   *   }
   * }
   * const proxiedInstance = proxyWrapper(MyClass, 'Alice');
   * await proxiedInstance.greet(); // Automatically wrapped with asyncHandler
   */
  <T extends object>(
    clsOrInstance: Constructor<T>,
    ...args: ConstructorParameters<Constructor<T>>
  ): WrappedMethods<T>;
};

// Define the ErrorOption type
export type ErrorOptions = {
  isDev?: boolean;
  write?: (error: unknown) => void;
};

// Define the ServeOptions type
export type ServeOptions = {
  path?: string;
  exclude?: string | string[];
};
