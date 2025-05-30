import { apiClient, withLoading } from '../client';
import type {
  ApiResponse,
  User,
  UpdateUserData,
  UpdateUserTierData,
  UserLimits,
} from '../types';

export class UserService {
  // Get user profile
  async getUserProfile(): Promise<User> {
    const response = await apiClient.get<User>('/users/profile');
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get user profile');
    }
    return response.data;
  }

  // Update user profile
  async updateUserProfile(data: UpdateUserData): Promise<User> {
    const response = await apiClient.put<User>('/users/profile', data);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update user profile');
    }
    return response.data;
  }

  // Update user tier (admin only)
  async updateUserTier(userId: string, data: UpdateUserTierData): Promise<User> {
    const response = await apiClient.put<User>(`/users/${userId}/tier`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update user tier');
    }
    return response.data;
  }

  // Get user limits
  async getUserLimits(): Promise<UserLimits> {
    const response = await apiClient.get<UserLimits>('/users/limits');
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get user limits');
    }
    return response.data;
  }

  // Delete user account
  async deleteAccount(): Promise<void> {
    const response = await apiClient.delete('/users/profile');
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete account');
    }
  }

  // Get user statistics
  async getUserStats(): Promise<any> {
    const response = await apiClient.get('/users/stats');
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get user statistics');
    }
    return response.data;
  }

  // Export user data
  async exportUserData(): Promise<any> {
    const response = await apiClient.get('/users/export');
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to export user data');
    }
    return response.data;
  }

  // Update user preferences
  async updatePreferences(preferences: Record<string, any>): Promise<User> {
    const response = await apiClient.put<User>('/users/preferences', { preferences });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update preferences');
    }
    return response.data;
  }

  // Get user preferences
  async getPreferences(): Promise<Record<string, any>> {
    const response = await apiClient.get<Record<string, any>>('/users/preferences');
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get preferences');
    }
    return response.data;
  }

  // Update notification settings
  async updateNotificationSettings(settings: Record<string, boolean>): Promise<User> {
    const response = await apiClient.put<User>('/users/notifications', { settings });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update notification settings');
    }
    return response.data;
  }

  // Get notification settings
  async getNotificationSettings(): Promise<Record<string, boolean>> {
    const response = await apiClient.get<Record<string, boolean>>('/users/notifications');
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get notification settings');
    }
    return response.data;
  }

  // Upload profile picture
  async uploadProfilePicture(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('profilePicture', file);

    const response = await fetch(`${apiClient.getBaseURL()}/users/profile/picture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await apiClient.getAuthToken()}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload profile picture');
    }

    const data = await response.json();
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to upload profile picture');
    }

    return data.data;
  }

  // Delete profile picture
  async deleteProfilePicture(): Promise<User> {
    const response = await apiClient.delete<User>('/users/profile/picture');
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to delete profile picture');
    }
    return response.data;
  }

  // Helper methods with loading states
  async getUserProfileWithLoading(
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<User | null> {
    return withLoading(() => apiClient.get<User>('/users/profile'), setLoading, setError);
  }

  async updateUserProfileWithLoading(
    data: UpdateUserData,
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<User | null> {
    return withLoading(() => apiClient.put<User>('/users/profile', data), setLoading, setError);
  }

  async getUserLimitsWithLoading(
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<UserLimits | null> {
    return withLoading(() => apiClient.get<UserLimits>('/users/limits'), setLoading, setError);
  }

  async deleteAccountWithLoading(
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<boolean> {
    const result = await withLoading(() => apiClient.delete('/users/profile'), setLoading, setError);
    return !!result;
  }

  async getUserStatsWithLoading(
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<any> {
    return withLoading(() => apiClient.get('/users/stats'), setLoading, setError);
  }

  async exportUserDataWithLoading(
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<any> {
    return withLoading(() => apiClient.get('/users/export'), setLoading, setError);
  }

  async updatePreferencesWithLoading(
    preferences: Record<string, any>,
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<User | null> {
    return withLoading(() => apiClient.put<User>('/users/preferences', { preferences }), setLoading, setError);
  }

  async getPreferencesWithLoading(
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<Record<string, any> | null> {
    return withLoading(() => apiClient.get<Record<string, any>>('/users/preferences'), setLoading, setError);
  }

  async updateNotificationSettingsWithLoading(
    settings: Record<string, boolean>,
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<User | null> {
    return withLoading(() => apiClient.put<User>('/users/notifications', { settings }), setLoading, setError);
  }

  async getNotificationSettingsWithLoading(
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<Record<string, boolean> | null> {
    return withLoading(() => apiClient.get<Record<string, boolean>>('/users/notifications'), setLoading, setError);
  }

  async uploadProfilePictureWithLoading(
    file: File,
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<User | null> {
    try {
      setLoading?.(true);
      setError?.(null);
      
      const result = await this.uploadProfilePicture(file);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setError?.(errorMessage);
      throw error;
    } finally {
      setLoading?.(false);
    }
  }

  async deleteProfilePictureWithLoading(
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<User | null> {
    return withLoading(() => apiClient.delete<User>('/users/profile/picture'), setLoading, setError);
  }

  // Utility methods
  isProfileComplete(user: User): boolean {
    return !!(
      user.email &&
      user.displayName &&
      user.profile?.firstName &&
      user.profile?.lastName
    );
  }

  getProfileCompletionPercentage(user: User): number {
    const fields = [
      user.email,
      user.displayName,
      user.profile?.firstName,
      user.profile?.lastName,
      user.profile?.phoneNumber,
      user.photoURL,
    ];
    
    const completedFields = fields.filter(field => !!field).length;
    return Math.round((completedFields / fields.length) * 100);
  }

  getDisplayName(user: User): string {
    if (user.displayName) return user.displayName;
    if (user.profile?.firstName && user.profile?.lastName) {
      return `${user.profile.firstName} ${user.profile.lastName}`;
    }
    if (user.profile?.firstName) return user.profile.firstName;
    return user.email.split('@')[0];
  }

  getInitials(user: User): string {
    const displayName = this.getDisplayName(user);
    const names = displayName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  }
}

// Export singleton instance
export const userService = new UserService();