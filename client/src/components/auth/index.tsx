// Authentication form components
export { LoginForm } from './LoginForm';
export { RegisterForm } from './RegisterForm';
export { PasswordResetForm } from './PasswordResetForm';
export { EmailVerificationReminder } from './EmailVerificationReminder';

// Authentication UI components
export { UserProfileDropdown } from './UserProfileDropdown';
export { AuthStatusIndicator } from './AuthStatusIndicator';
export { AuthButton } from './AuthButton';
export { AuthStatusBanner } from './AuthStatusBanner';

// Debug components
export { FirebaseDebug } from './FirebaseDebug';

// Route protection
export { ProtectedRoute, withProtectedRoute } from './ProtectedRoute';

// Re-export auth context for convenience
export { useAuth, withAuth, useAuthGuard } from '@/lib/auth/context';