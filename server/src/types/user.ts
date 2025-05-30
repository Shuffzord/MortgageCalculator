export interface User {
  uid: string;
  email: string;
  createdAt: string;
  displayName?: string;
  photoURL?: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  displayName?: string;
  photoURL?: string;
}

export interface UpdateUserData {
  displayName?: string;
  photoURL?: string;
}