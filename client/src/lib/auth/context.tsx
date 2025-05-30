import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { apiClient } from '../api/client';
import type { User, CreateUserData, UpdateUserData } from '../api/types';
import { UserTier } from '../api/types';

// Auth context interface
interface AuthContextType {
  // User state
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Auth methods
  login: (email: string, password: string) => Promise<void>;
  register: (userData: CreateUserData) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: UpdateUserData) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // User tier management
  getUserTier: () => UserTier;
  isPremium: () => boolean;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Clear error
  const clearError = () => setError(null);

  // Fetch user data from backend
  const fetchUserData = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    try {
      const response = await apiClient.get<User>('/users/profile');
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      return null;
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    if (firebaseUser) {
      const userData = await fetchUserData(firebaseUser);
      setUser(userData);
    }
  };

  // Handle auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        // User is signed in, fetch additional user data
        const userData = await fetchUserData(firebaseUser);
        setUser(userData);
      } else {
        // User is signed out
        setUser(null);
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // Login method
  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // The onAuthStateChanged listener will handle setting the user state
      // We don't need to manually set it here
      
    } catch (error: any) {
      let errorMessage = 'Login failed';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later';
          break;
        default:
          errorMessage = error.message || 'Login failed';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Register method
  const register = async (userData: CreateUserData) => {
    try {
      setError(null);
      setIsLoading(true);
      
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );
      
      // Update Firebase profile if displayName provided
      if (userData.displayName) {
        await updateProfile(userCredential.user, {
          displayName: userData.displayName,
          photoURL: userData.photoURL || null,
        });
      }
      
      // Send email verification
      await sendEmailVerification(userCredential.user);
      
      // Create user profile in backend
      try {
        await apiClient.post('/users', {
          email: userData.email,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          profile: userData.profile,
        });
      } catch (backendError) {
        console.error('Failed to create user profile in backend:', backendError);
        // Don't throw here as the Firebase user was created successfully
      }
      
    } catch (error: any) {
      let errorMessage = 'Registration failed';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please choose a stronger password';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled';
          break;
        default:
          errorMessage = error.message || 'Registration failed';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout method
  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } catch (error: any) {
      setError(error.message || 'Logout failed');
      throw error;
    }
  };

  // Reset password method
  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      let errorMessage = 'Failed to send reset email';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        default:
          errorMessage = error.message || 'Failed to send reset email';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Update user profile method
  const updateUserProfile = async (data: UpdateUserData) => {
    try {
      setError(null);
      
      if (!firebaseUser) {
        throw new Error('No user logged in');
      }
      
      // Update Firebase profile
      if (data.displayName !== undefined || data.photoURL !== undefined) {
        await updateProfile(firebaseUser, {
          displayName: data.displayName || firebaseUser.displayName,
          photoURL: data.photoURL || firebaseUser.photoURL,
        });
      }
      
      // Update backend profile
      await apiClient.put('/users/profile', data);
      
      // Refresh user data
      await refreshUser();
      
    } catch (error: any) {
      setError(error.message || 'Failed to update profile');
      throw error;
    }
  };

  // Change password method
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setError(null);
      
      if (!firebaseUser || !firebaseUser.email) {
        throw new Error('No user logged in');
      }
      
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      
      // Update password
      await updatePassword(firebaseUser, newPassword);
      
    } catch (error: any) {
      let errorMessage = 'Failed to change password';
      
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = 'Current password is incorrect';
          break;
        case 'auth/weak-password':
          errorMessage = 'New password is too weak';
          break;
        case 'auth/requires-recent-login':
          errorMessage = 'Please log in again before changing your password';
          break;
        default:
          errorMessage = error.message || 'Failed to change password';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Send verification email method
  const sendVerificationEmail = async () => {
    try {
      setError(null);
      
      if (!firebaseUser) {
        throw new Error('No user logged in');
      }
      
      await sendEmailVerification(firebaseUser);
      
    } catch (error: any) {
      setError(error.message || 'Failed to send verification email');
      throw error;
    }
  };

  // Get user tier
  const getUserTier = (): UserTier => {
    return user?.tier || UserTier.Free;
  };

  // Check if user is premium
  const isPremium = (): boolean => {
    return getUserTier() === 'premium';
  };

  // Context value
  const value: AuthContextType = {
    user,
    firebaseUser,
    isLoading,
    isAuthenticated: !!firebaseUser,
    login,
    register,
    logout,
    resetPassword,
    updateUserProfile,
    changePassword,
    sendVerificationEmail,
    refreshUser,
    getUserTier,
    isPremium,
    error,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// HOC for protected routes
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    
    if (isLoading) {
      return <div>Loading...</div>; // You can replace this with a proper loading component
    }
    
    if (!isAuthenticated) {
      return <div>Please log in to access this page.</div>; // You can replace this with a login redirect
    }
    
    return <Component {...props} />;
  };
}

// Hook for protected actions
export function useAuthGuard() {
  const { isAuthenticated, isPremium } = useAuth();
  
  const requireAuth = (action: () => void, fallback?: () => void) => {
    if (isAuthenticated) {
      action();
    } else {
      fallback?.();
    }
  };
  
  const requirePremium = (action: () => void, fallback?: () => void) => {
    if (isAuthenticated && isPremium()) {
      action();
    } else {
      fallback?.();
    }
  };
  
  return { requireAuth, requirePremium };
}