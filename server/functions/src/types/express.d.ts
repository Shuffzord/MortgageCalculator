import { UserRecord } from 'firebase-admin/auth';

declare global {
  namespace Express {
    interface Request {
      user?: UserRecord;
    }
  }
}

export {}; // Make this a module