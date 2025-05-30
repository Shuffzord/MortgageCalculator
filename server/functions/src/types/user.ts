export enum UserTier {
  Free = 'free',
  Premium = 'premium'
}

export interface User {
  uid: string;
  email: string;
  createdAt: string;
  displayName?: string;
  photoURL?: string;
  tier: UserTier;
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  displayName?: string;
  photoURL?: string;
  profile?: UserProfile;
}

export interface UpdateUserData {
  displayName?: string;
  photoURL?: string;
  profile?: UserProfile;
}

export interface UpdateUserTierData {
  tier: UserTier;
}

export interface UserLimits {
  maxCalculations: number;
  maxSavedScenarios: number;
}