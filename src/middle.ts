import {join} from 'path';
import {match} from 'path-to-regexp';
import {HttpError, InternalServerError} from './errors';
import type {ErrorOptions, ServeOptions} from './types';
import express, {
  Router,
  type ErrorRequestHandler,
  type RequestHandler,
} from 'express';

/**
 * Express middleware to handle `HttpError` and unknown errors.
 *
 * - Sends JSON response for `HttpError` instances.
 * - Logs unknown errors and sends generic error response.
 * - Includes detailed error info in development (`isDev`).
 *
 * @param {object} [options] - Options for error handling.
 * @param {boolean} [options.isDev=true] - Include detailed error information in responses if true. Default is `true`.
 * @param {(err: unknown) => void} [options.write] - Function to handle logging of unknown errors. If not provided, errors will not be logged.
 *
 * @returns {ErrorRequestHandler} - Middleware for handling errors.
 *
 * @example
 * // Basic usage with default options:
 * app.use(globalErrorHandler({ isDev: process.env.NODE_ENV !== 'production' }));
 *
 * // Custom usage with a logging function in production mode:
 * app.use(globalErrorHandler({
 *  isDev: process.env.NODE_ENV !== 'production',
 *  write: error => console.error(error)
 * }));
 */
export const globalErrorHandler = (
  options: ErrorOptions = {},
): ErrorRequestHandler => {
  const {isDev = true, write = undefined} = options;

  return (err, req, res, next): any => {
    // Handle known HttpError instances
    if (HttpError.isHttpError(err))
      return res.status(err.status).json(err.toJson());

    // Write unknown errors if a write function is provided
    write?.(err);

    // Create an InternalServerError for unknown errors
    const error = new InternalServerError(
      isDev ? err.message : 'Something went wrong',
      isDev ? err.stack : null,
    );
    return res.status(error.status).json(error.toJson());
  };
};

/**
 * Middleware to serve static files and handle SPA routing.
 * Serves static files from a directory and returns `index.html` for unmatched routes,
 * excluding specified patterns (e.g., API routes).
 *
 * @param {object} [options] - Configuration options.
 * @param {string} [options.path="public"] - Directory to serve static files from.
 * @param {Array<string>|string} [options.exclude='/api{/*path}'] - Routes to exclude from SPA routing.
 * @returns {Router} - Express Router configured for static file serving and SPA routing.
 *
 * @example
 * // Serve static files from "public" directory and handle SPA routing
 * app.use(serveStatic({ path: 'public', exclude: '/api{/*path}' }));
 */
export const serveStatic = (options: ServeOptions = {}): Router => {
  const {exclude = '/api{/*path}', path = join(process.cwd(), 'public')} =
    options;
  const excludes = Array.isArray(exclude) ? exclude : [exclude];

  const indexFile = join(path, 'index.html');
  const excludeMatchers = excludes.map(pattern => match(pattern, {end: false}));

  /** Checks if a path matches any excluded patterns. */
  const isExcluded = (pathname: string): boolean =>
    excludeMatchers.some(matcher => matcher(pathname));

  /** Middleware to serve `index.html` for non-excluded routes. */
  const renderIndex: RequestHandler = (req, res, next) => {
    const pathname = req.originalUrl.split('?')[0];
    if (isExcluded(pathname)) return next();
    res.sendFile(indexFile);
  };

  return express
    .Router()
    .use(express.static(path, {index: false})) // Serve static files
    .get('*', renderIndex); // Handle SPA routing
};
