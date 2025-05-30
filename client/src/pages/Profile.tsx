import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { User, Mail, Shield, Crown, Save, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import SEOHead from '@/components/SEOHead';
import { withAuth } from '@/lib/auth/context';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters').optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

function ProfilePage() {
  const { t } = useTranslation();
  const { 
    user, 
    firebaseUser, 
    updateUserProfile, 
    changePassword,
    sendVerificationEmail,
    isPremium,
    error, 
    clearError, 
    isLoading 
  } = useAuth();
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState(false);
  const [passwordUpdateSuccess, setPasswordUpdateSuccess] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || firebaseUser?.displayName || '',
      firstName: user?.profile?.firstName || '',
      lastName: user?.profile?.lastName || '',
      phoneNumber: user?.profile?.phoneNumber || '',
      address: user?.profile?.address || '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      clearError();
      await updateUserProfile({
        displayName: data.displayName,
        profile: {
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber,
          address: data.address,
        },
      });
      setProfileUpdateSuccess(true);
      setTimeout(() => setProfileUpdateSuccess(false), 3000);
    } catch (error) {
      // Error is handled by the auth context
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      clearError();
      await changePassword(data.currentPassword, data.newPassword);
      setPasswordUpdateSuccess(true);
      passwordForm.reset();
      setTimeout(() => setPasswordUpdateSuccess(false), 3000);
    } catch (error) {
      // Error is handled by the auth context
    }
  };

  const handleSendVerification = async () => {
    try {
      clearError();
      await sendVerificationEmail();
      setVerificationSent(true);
      setTimeout(() => setVerificationSent(false), 5000);
    } catch (error) {
      // Error is handled by the auth context
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const displayName = user?.displayName || firebaseUser?.displayName;
  const email = user?.email || firebaseUser?.email;
  const photoURL = user?.photoURL || firebaseUser?.photoURL;
  const isEmailVerified = firebaseUser?.emailVerified;

  return (
    <>
      <SEOHead
        pageTitle={`${t('auth.profile.title', 'Profile')} - ${t('app.title')}`}
        pageDescription={t('auth.profile.description', 'Manage your account settings and preferences')}
      />
      
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {t('auth.profile.title', 'Profile')}
            </h1>
            <p className="text-gray-600 mt-2">
              {t('auth.profile.subtitle', 'Manage your account settings and preferences')}
            </p>
          </div>

          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={photoURL || undefined} alt={displayName || email || 'User'} />
                  <AvatarFallback className="text-lg">
                    {getInitials(displayName || undefined, email || undefined)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold">
                    {displayName || t('auth.profile.noName', 'User')}
                  </h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-gray-600">{email}</p>
                    {isEmailVerified ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <Shield className="h-3 w-3 mr-1" />
                        {t('auth.profile.verified', 'Verified')}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                        <Mail className="h-3 w-3 mr-1" />
                        {t('auth.profile.unverified', 'Unverified')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    {isPremium() && (
                      <Badge variant="secondary">
                        <Crown className="h-3 w-3 mr-1" />
                        {t('auth.profile.premium', 'Premium')}
                      </Badge>
                    )}
                  </div>
                </div>
                {!isEmailVerified && (
                  <Button
                    onClick={handleSendVerification}
                    variant="outline"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('auth.profile.verifyEmail', 'Verify Email')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {profileUpdateSuccess && (
            <Alert className="mb-6">
              <AlertDescription>
                {t('auth.profile.updateSuccess', 'Profile updated successfully!')}
              </AlertDescription>
            </Alert>
          )}

          {passwordUpdateSuccess && (
            <Alert className="mb-6">
              <AlertDescription>
                {t('auth.profile.passwordUpdateSuccess', 'Password updated successfully!')}
              </AlertDescription>
            </Alert>
          )}

          {verificationSent && (
            <Alert className="mb-6">
              <AlertDescription>
                {t('auth.verification.sent', 'Verification email sent! Please check your inbox.')}
              </AlertDescription>
            </Alert>
          )}

          {/* Profile Tabs */}
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile">{t('auth.profile.personalInfo', 'Personal Information')}</TabsTrigger>
              <TabsTrigger value="security">{t('auth.profile.security', 'Security')}</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>{t('auth.profile.personalInfo', 'Personal Information')}</CardTitle>
                  <CardDescription>
                    {t('auth.profile.personalInfoDescription', 'Update your personal information and profile details')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                      <FormField
                        control={profileForm.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('auth.displayName', 'Display Name')}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t('auth.displayNamePlaceholder', 'Enter your display name')}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              {t('auth.profile.displayNameDescription', 'This is how your name will appear to other users')}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('auth.profile.firstName', 'First Name')}</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={t('auth.profile.firstNamePlaceholder', 'Enter your first name')}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('auth.profile.lastName', 'Last Name')}</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={t('auth.profile.lastNamePlaceholder', 'Enter your last name')}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={profileForm.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('auth.profile.phoneNumber', 'Phone Number')}</FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder={t('auth.profile.phoneNumberPlaceholder', 'Enter your phone number')}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('auth.profile.address', 'Address')}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t('auth.profile.addressPlaceholder', 'Enter your address')}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" />
                        {t('auth.profile.saveChanges', 'Save Changes')}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>{t('auth.profile.changePassword', 'Change Password')}</CardTitle>
                  <CardDescription>
                    {t('auth.profile.changePasswordDescription', 'Update your password to keep your account secure')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('auth.profile.currentPassword', 'Current Password')}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showCurrentPassword ? 'text' : 'password'}
                                  placeholder={t('auth.profile.currentPasswordPlaceholder', 'Enter your current password')}
                                  autoComplete="current-password"
                                  {...field}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                  {showCurrentPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('auth.profile.newPassword', 'New Password')}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showNewPassword ? 'text' : 'password'}
                                  placeholder={t('auth.profile.newPasswordPlaceholder', 'Enter your new password')}
                                  autoComplete="new-password"
                                  {...field}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                  {showNewPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormDescription>
                              {t('auth.passwordRequirements', 'Must be at least 8 characters with uppercase, lowercase, and number')}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('auth.confirmPassword', 'Confirm New Password')}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showConfirmPassword ? 'text' : 'password'}
                                  placeholder={t('auth.confirmPasswordPlaceholder', 'Confirm your new password')}
                                  autoComplete="new-password"
                                  {...field}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                  {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Shield className="mr-2 h-4 w-4" />
                        {t('auth.profile.updatePassword', 'Update Password')}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}

export default withAuth(ProfilePage);