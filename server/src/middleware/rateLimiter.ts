import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../utils/errors';

const WINDOW_SIZE_IN_MINUTES = 15;
const MAX_REQUESTS_PER_WINDOW = 100;

interface RequestRecord {
  count: number;
  startTime: number;
}

const requestMap = new Map<string, RequestRecord>();

export const rateLimiterMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowSize = WINDOW_SIZE_IN_MINUTES * 60 * 1000;

  if (requestMap.has(ip)) {
    const record = requestMap.get(ip)!;
    if (now - record.startTime > windowSize) {
      record.count = 1;
      record.startTime = now;
    } else {
      record.count++;
      if (record.count > MAX_REQUESTS_PER_WINDOW) {
        throw new CustomError('Rate limit exceeded', 429);
      }
    }
  } else {
    requestMap.set(ip, { count: 1, startTime: now });
  }

  next();
};