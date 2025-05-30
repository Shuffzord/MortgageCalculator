import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';
import { BadRequestError } from '../utils/errors';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error: ValidationError) => error.msg);
    throw new BadRequestError(`Validation error: ${errorMessages.join(', ')}`);
  }
  next();
};