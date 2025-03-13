# Ex⚡

[![npm downloads](https://img.shields.io/npm/dm/exutile.svg)](https://www.npmjs.com/package/exutile)
[![npm version](https://img.shields.io/npm/v/exutile.svg)](https://www.npmjs.com/package/exutile)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview 🌟

> `exutile` is a lightweight utility library designed specifically for Express.js, helping developers simplify server-side logic and reduce boilerplate code. It provides ready-to-use features like error handling, HTTP status utilities, and standardized API responses, enabling you to write cleaner, more maintainable code effortlessly.

## Table of Contents 📚

- [Features](#features-)
- [Installation](#installation-)
- [Motivation](#motivation-)
- [Quick Start](#quick-start-)
- [`globalErrorHandler`: Error Handler Middleware](#globalerrorhandler-error-handler-middleware-)
- [`async-handler`: Simplifying Controllers](#async-handler-simplifying-controllers-️)
- [Standardized JSON Responses with ApiRes](#standardized-json-responses-with-apires-)
- [HttpError](#httperror-)
- [HttpStatus](#httpstatus-)
- [`proxyWrapper`: Class Controllers](#proxywrapper-class-controllers-️)
- [Conclusion](#conclusion-)
- [Contributing](#contributing-)
- [Author](#author-)
- [License](#license-)

## Features ✨

- ✅ Simplified error handling with `globalErrorHandler`
- ✅ Automatic async error handling using `async-handler`
- ✅ Standardized API responses with `ApiRes`
- ✅ Flexible HTTP status codes and custom error classes
- ✅ Class-based controllers with `proxyWrapper`

## Motivation 💡

> Building APIs often involves repetitive tasks like handling errors, managing HTTP status codes, or structuring JSON responses. `exutile` was created to eliminate this hassle, allowing developers to focus on writing business logic instead of reinventing common solutions. Whether you're a beginner or an experienced developer, `exutile` streamlines your workflow and ensures your **Express** applications are consistent and reliable.

## Installation 📥

```bash
npm install --save exutile
```

## Quick Start ⚡

Here’s a minimal setup to get you started with exutile:

```typescript
import express from 'express';
import {handler, globalErrorHandler} from 'exutile';

const app = express();

// Middleware
app.use(express.json());

// Example route using async-handler
const getUser = handler(async (req, res) => {
  const user = await getUserById(req.params.id);
  return ApiRes.ok(user); // Send user data in the response
});

// Routers
app.get('/user/:id', getUser);

// Error handling middleware
app.use(
  globalErrorHandler({
    isDev: process.env.NODE_ENV === 'development',
    write: error => console.error(error),
  }),
);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## `globalErrorHandler`: Error Handler Middleware 🚨

The `globalErrorHandler` middleware manages **HttpErrors** and **Unknown** errors, returning appropriate **json responses.**

**Usage:**

```typescript
import {errorHandler} from 'exutile';

// Basic usage with default options
app.use(
  globalErrorHandler({
    isDev: process.env.NODE_ENV === 'development',
  }),
);

// Custom usage with logging in production mode
app.use(
  globalErrorHandler({
    isDev: process.env.NODE_ENV === 'development',
    write: error => console.error(error),
  }),
);
```

**Signature:**  
`globalErrorHandler({ isDev: boolean, write?: (err) => void }): ErrorRequestHandler`

**Options:**

- **isDev**: Enables detailed error messages in development mode (default: **true**).
- **write**: Optional callback for logging or handling errors.

## `async-handler`: Simplifying Controllers 🛠️

Eliminates repetitive **`try-catch`** blocks by managing error handling for both async and sync functions. It also integrates seamlessly with **ApiRes** for enhanced response handling.

### Simplifying Route Handlers

```typescript
import {handler, ApiRes} from 'exutile';

// Route without async-handler (traditional approach with try-catch)
app.get('/user/:id', async (req, res, next) => {
  try {
    const user = await getUserById(req.params.id);
    res.status(200).json(user);
  } catch (error) {
    next(error); // Pass the error to the error-handling middleware
  }
});

// Route using handler (simplified with exutile)
app.get(
  '/user/:id',
  handler(async (req, res) => {
    const user = await getUserById(req.params.id); // Fetch user from database
    return ApiRes.ok(user, 'User fetched successfully'); // Send success response using ApiRes
  }),
);
```

### Advanced Example: Handling Cookies and Headers

```typescript
import {handler, Handler} from 'exutile';

// Login type handler
type LoginHandler = Handler<{email: string; password: string}>;

// Login request handler
const login = handler<LoginHandler>(async (req, res) => {
  const {email, password} = req.body;
  const user = await loginUser(email, password);

  // Manually setting headers
  res.setHeader('X-Custom-Header', 'SomeHeaderValue');

  // Set multiple cookies for authentication
  res.cookie('access-token', user.accessToken, {
    httpOnly: true,
    secure: true, // Set to true in production with HTTPS
    maxAge: 3600000, // 1 hour
  });

  res.cookie('refresh-token', user.refreshToken, {
    httpOnly: true,
    secure: true,
    maxAge: 7 * 24 * 3600000, // 1 week
  });

  // API response with token and user info
  return ApiRes.ok(user, 'Logged in successfully');
});
```

### Minimal Examples

- **Simple Response:**

```typescript
const getHome = handler(() => 'Hello World!');
```

- **Custom JSON Response:**

```typescript
const getHome = handler(() => ({message: 'Hello World!'}));
```

- **Without ApiRes:**

```typescript
const login = handler(async (req, res) => {
  const user = await getUserById(req.params.id);
  // Manually setting headers
  res.setHeader('X-Custom-Header', 'SomeHeaderValue');
  // Setting cookies
  res.cookie('access-token', user.accessToken, {
    httpOnly: true,
    secure: true, // Set to true in production with HTTPS
    maxAge: 3600000, // 1 hour
  });
  // Sending a custom JSON response
  return res.status(200).json({
    status: 'success',
    message: 'User fetched successfully',
    data: user,
  });
});
```

### Middleware Example: Role-Based Access Control

```typescript
import {Role} from './constants';
import {handler, ForbiddenError} from 'exutile';

/** Permission middleware */
export const permission = (...roles: Role[]) =>
  handler(async (req, _, next) => {
    const {user} = req;

    if (!roles.includes(user?.role))
      throw new ForbiddenError(`Access denied for ${req.originalUrl}`);

    next();
  });

export const onlyAdmin = permission(Role.ADMIN);
export const adminOrUser = permission(Role.ADMIN, Role.USER);
```

## Standardized JSON Responses with ApiRes 📊

ApiRes provides a consistent structure for API responses. It includes several static methods that handle common response patterns, such as `ok`, `created`, and `paginated`.

#### Usage:

```typescript
import {ApiRes} from 'exutile';

// With paginated
const list = handler(async req => {
  const {data, meta} = await getUsers(req.query);
  return ApiRes.paginated(data, meta, 'Get users list successfully');
});

// With created
const create = handler(async req => {
  const user = await createUser(req.body);
  return ApiRes.created(user, 'User created successfully');
});

// With ok
const get = handler(async req => {
  const user = await getUser(req.params);
  return ApiRes.ok(user, 'Get user successfully');
});

// Routers
app.route('/').get(list).post(create);
app.route('/:id').get(get);
```

### ApiRes Methods

- `ok(result, message)`: Returns a success response (HTTP 200).
- `created(result, message)`: Returns a resource creation response (HTTP 201).
- `paginated(data, meta, message)`: Returns a success response (HTTP 200).

## HttpError ❌

The HttpError class standardizes error handling by extending the native Error class. It’s used to throw HTTP-related errors, which are then caught by the **`globalErrorHandler`** middleware.

#### Usage:

```typescript
import {HttpError, HttpStatus} from 'exutile';

// Example without async-handler
app.get('*', () => {
  throw new HttpError('Not Found', HttpStatus.NOT_FOUND); // Throw a 404 error
});

// Example with async-handler
app.post(
  '/example',
  handler(req => {
    if (!req.body.name) throw new BadRequestError('Name is required');
  }),
);
```

### HttpError(msg, status, details):

- `msg`: This parameter accepts an error message, which can be a single string or an array of strings (required).
- `status`: The status code of the error, mirroring `statusCode` for general compatibility (default is 500).
- `detail`: This is an optional plain object that contains additional information about the error.

```typescript
const err = new HttpError('Validation error.', 400, {
  username: 'Username is required',
  password: 'Password is required',
});
```

> _Note: If only a status code is provided, the **HttpError** class will automatically generate an appropriate error name based on that status code._

### Common HTTP Errors:

- `BadRequestError`
- `UnAuthorizedError`
- `NotFoundError`
- `ConflictError`
- `ForbiddenError`
- `PaymentRequiredError`
- `NotImplementedError`
- `InternalServerError`

### `isHttpError(value)` Static Method:

The `HttpError.isHttpError(value)` method determines if a specific value is an instance of the `HttpError` class.

```typescript
// If it is an HttpError, send a JSON response with the error details
if (HttpError.isHttpError(err))
  return res.status(err.status).json(err.toJson());
else {
  // If it's not an HttpError, pass it to the next middleware for further handling
  next(err);
}
```

### Error Properties:

- **status**: The HTTP status code associated with the error.
- **message**: A brief description of the error.
- **stack**: The stack trace of the error (available in development mode).
- **details**: Optional additional information about the error.

### Custom ErrorHandler Middleware

```typescript
export const errorHandler: ErrorRequestHandler = (err, req, res, next): any => {
  // Handle known HttpError instances
  if (HttpError.isHttpError(err))
    return res.status(err.status).json(err.toJson());

  // Log unknown errors
  console.error(err);

  // Create an InternalServerError for unknown errors
  const error = new InternalServerError(
    config.dev ? err.message : 'Something went wrong',
    config.dev ? err.stack : null,
  );
  return res.status(error.status).json(error.toJson());
};
```

### `error.toJson()` Method:

Converts an `HttpError` instance into a structured JSON format.

```typescript
return res.status(err.status).json(err.toJson());
```

> _Note: **details** if applicable then additional information that provides context about the error._

## HttpStatus ✅

The `HttpStatus` provides readable constants for standard HTTP status codes **(2xx, 3xx, 4xx, 5xx)** and **Names**, improving code clarity and consistency.

#### Usage:

```typescript
import {HttpStatus} from 'exutile';

// Example: Basic usage in a route
app.get('/status-example', (req, res) => {
  res.status(HttpStatus.OK).json({message: 'All good!'});
});

// Example: Custom error handling middleware
app.use((req, res) => {
  res.status(HttpStatus.NOT_FOUND).json({
    error: 'Resource not found',
  });
});

// Example: Response with a 201 Created status
app.post('/create', (req, res) => {
  const resource = createResource(req.body);
  res.status(HttpStatus.CREATED).json({
    message: 'Resource created successfully',
    data: resource,
  });
});
```

### `HttpStatus.NAMES` of HTTP Status Code Name:

The `NAMES` object provides a simple lookup for the descriptive names of HTTP status codes.

```typescript
const statusName = HttpStatus.NAMES.$200; // 'OK'
```

### Commonly Used HTTP Status Codes:

- **2xx: Success**

  - `HttpStatus.OK`: 200 — Request succeeded.
  - `HttpStatus.CREATED`: 201 — Resource created.
  - `HttpStatus.ACCEPTED`: 202 — Request accepted for processing.
  - `HttpStatus.NO_CONTENT`: 204 — No content to send.
  - and more ....

- **3xx: Redirection**

  - `HttpStatus.MOVED_PERMANENTLY`: 301 — Resource moved permanently.
  - `HttpStatus.FOUND`: 302 — Resource found at another URI.
  - `HttpStatus.NOT_MODIFIED`: 304 — Resource not modified.
  - and more ....

- **4xx: Client Error**

  - `HttpStatus.BAD_REQUEST`: 400 — Bad request.
  - `HttpStatus.UNAUTHORIZED`: 401 — Authentication required.
  - `HttpStatus.FORBIDDEN`: 403 — Access forbidden.
  - `HttpStatus.NOT_FOUND`: 404 — Resource not found.
  - and more ....

- **5xx: Server Error**
  - `HttpStatus.INTERNAL_SERVER_ERROR`: 500 — Internal server error.
  - `HttpStatus.NOT_IMPLEMENTED`: 501 — Not implemented.
  - `HttpStatus.SERVICE_UNAVAILABLE`: 503 — Service unavailable.
  - and more ....

## `proxyWrapper`: Class Controllers 🏗️

`exutile` provides the utility `proxyWrapper` to make simplify working with class-based controllers in Express.

#### Usage:

```typescript
// example-controller.ts
import {Request} from 'express';

// Controller Class
class ExampleController {
  constructor(private message: string) {}

  async getData(req: Request) {
    // Your logic here
    return ApiRes.ok({}, this.message);
  }
}

// example-routes.ts
import {Router} from 'express';
import {proxyWrapper} from 'exutile';
import {ExampleController} from './example-controller.ts';

const exampleRoutes = (): Router => {
  const router = Router();

  // Create a proxied instance of ExampleController
  const example = proxyWrapper(ExampleController, 'Hello World');

  // Configure routes
  return router.post('/data', example.getData);
};
```

### `proxyWrapper(clsOrInstance, ...args)`:

- **Parameters**:
  - `clsOrInstance`: A class constructor or an instance of a class.
  - `args`: Arguments for the class constructor (if `clsOrInstance` is a constructor).
- **Returns**: A proxied instance where all methods are wrapped with `async-handler`.

### How It Works

- Instantiates the specified class if a constructor is provided.
- Wraps all its methods with `async-handler`, allowing for automatic handling of asynchronous operations.
- **Prevents method/property** overrides for safety.

### Using Dependency Injection Libraries:

You can use `proxyWrapper` with dependency injection libraries like `tsyringe` or `typedi`.

#### Example with `tsyringe`

```typescript
const exampleRoutes = (): Router => {
  const router = Router();

  // Create a proxied instance of ExampleController
  const example = proxyWrapper(container.resolve(ExampleController));

  // Configure routes
  return router.post('/data', example.getData);
};
```

#### Example with `typedi`

```typescript
const exampleRoutes = (): Router => {
  const router = Router();

  // Create a proxied instance of ExampleController
  const example = proxyWrapper(Container.get(ExampleController));

  // Configure routes
  return router.post('/data', example.getData);
};
```

## Conclusion 🏁

`exutile` is a powerful tool designed to simplify and enhance Express.js applications by providing essential features out of the box. Whether you’re building a simple API or a complex web application, exutile helps you maintain clean and manageable code.

## Contributing 🤝

Contributions are highly appreciated! To contribute:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Submit a pull request with a clear description of your changes.

## Author 👤

- Created by **Aashish Panchal**.
- GitHub: [@aashishpanchal](https://github.com/aashishpanchal)

## License 📜

[MIT © Aashish Panchal](LICENSE)
