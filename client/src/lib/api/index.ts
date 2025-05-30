// Main API module exports
export * from './types';
export * from './client';
export * from './services';

// Firebase configuration
export { auth, db } from '../firebase/config';

// Authentication context
export { AuthProvider, useAuth, withAuth, useAuthGuard } from '../auth/context';