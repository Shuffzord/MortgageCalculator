import { UserTier } from './user';

export interface CustomUser {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  customClaims?: { [key: string]: any };
  tier?: UserTier;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
  createdAt?: string;
}