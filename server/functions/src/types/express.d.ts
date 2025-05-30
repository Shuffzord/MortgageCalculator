import { CustomUser } from './customUser';

declare global {
  namespace Express {
    interface Request {
      user?: CustomUser;
    }
  }
}

export {};