export class CustomError extends Error {
  constructor(public message: string, public statusCode: number) {
    super(message);
    Object.setPrototypeOf(this, CustomError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}

export class BadRequestError extends CustomError {
  constructor(message: string) {
    super(message, 400);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

export class NotFoundError extends CustomError {
  constructor() {
    super('Route not found', 404);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class UnauthorizedError extends CustomError {
  constructor() {
    super('Not authorized', 401);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class AppError extends CustomError {
  constructor(message: string, statusCode: number, public code?: string) {
    super(message, statusCode);
    Object.setPrototypeOf(this, AppError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message, code: this.code }];
  }
}