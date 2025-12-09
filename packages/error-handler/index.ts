export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number,
    isOperational: true,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this);
  }
}

// Not found error
export class NotFoundError extends AppError {
  constructor(message = "Resources not found", details?: any) {
    super(message, 404, true, details);
  }
}

// validation error function
// use for Joi/zod/react-hook form validation errors
export class ValidationError extends AppError {
  constructor(message = "Invalid request data", details?: any) {
    super(message, 400, true, details);
  }
}

// authentication error
export class AuthError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, true);
  }
}

// forbidden error
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden access", details?: any) {
    super(message, 403, true, details);
  }
}

// for database error
export class DatabaseError extends AppError {
  constructor(message = "Database Error!", details?: any) {
    super(message, 500, true, details);
  }
}

//rate limiting error
export class RateLimitError extends AppError {
  constructor(message = "Too many requests, try again later") {
    super(message, 429, true);
  }
}
