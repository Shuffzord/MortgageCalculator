# API Client & Authentication Integration Guide

This guide explains how to use the newly implemented API client and authentication system in the frontend.

## Overview

The API integration consists of:
1. **API Client** - Centralized HTTP client with authentication and error handling
2. **Authentication Context** - Firebase Auth integration with user management
3. **Service Layer** - Type-safe API services for all backend endpoints
4. **React Hooks** - Easy-to-use hooks for common operations
5. **TypeScript Types** - Complete type safety for API communication

## Quick Start

### 1. Environment Setup

Copy `client/.env.example` to `client/.env` and configure your environment variables:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
# ... other Firebase config

# API Configuration
VITE_API_BASE_URL=http://localhost:5001/mortgage-firebase-firebase/us-central1/api

# Stripe Configuration
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
```

### 2. Authentication Usage

The app is already wrapped with `AuthProvider`. Use the `useAuth` hook in any component:

```tsx
import { useAuth } from '@/lib/api';

function MyComponent() {
  const { user, isAuthenticated, login, logout, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  if (!isAuthenticated) {
    return (
      <button onClick={() => login('user@example.com', 'password')}>
        Login
      </button>
    );
  }

  return (
    <div>
      <p>Welcome, {user?.displayName || user?.email}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### 3. API Services Usage

#### Using Services Directly

```tsx
import { calculationService } from '@/lib/api';

// Create a calculation
const newCalculation = await calculationService.createCalculation({
  title: 'My Mortgage',
  loanAmount: 300000,
  interestRate: 3.5,
  loanTerm: 30,
});

// Get user's calculations
const calculations = await calculationService.listCalculations();
```

#### Using React Hooks (Recommended)

```tsx
import { useCalculations } from '@/lib/api/hooks';

function CalculationsList() {
  const {
    calculations,
    isLoading,
    error,
    createCalculation,
    deleteCalculation,
    refresh
  } = useCalculations();

  const handleCreate = async () => {
    await createCalculation({
      title: 'New Calculation',
      loanAmount: 250000,
      interestRate: 4.0,
      loanTerm: 25,
    });
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <button onClick={handleCreate}>Create New</button>
      {calculations.map(calc => (
        <div key={calc.id}>
          <h3>{calc.title}</h3>
          <button onClick={() => deleteCalculation(calc.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Available Services

### 1. Calculation Service

```tsx
import { calculationService, useCalculations } from '@/lib/api';

// Service methods
calculationService.createCalculation(data)
calculationService.getCalculation(id)
calculationService.updateCalculation(id, data)
calculationService.deleteCalculation(id)
calculationService.listCalculations(params)
calculationService.shareCalculation(id)
calculationService.getUsageStats()

// React hooks
const { calculations, createCalculation, ... } = useCalculations();
const { calculation, updateCalculation, ... } = useCalculation(id);
const { stats, ... } = useUsageStats();
```

### 2. Payment Service

```tsx
import { paymentService, useSubscription } from '@/lib/api';

// Service methods
paymentService.createCheckoutSession(request)
paymentService.getSubscriptionStatus()
paymentService.cancelSubscription()
paymentService.getPaymentHistory()

// React hooks
const { subscription, status, cancelSubscription, ... } = useSubscription();
const { payments, ... } = usePaymentHistory();
const { plans, ... } = useSubscriptionPlans();
```

### 3. User Service

```tsx
import { userService } from '@/lib/api';

// Service methods
userService.getUserProfile()
userService.updateUserProfile(data)
userService.getUserLimits()
userService.updatePreferences(preferences)
```

### 4. Export Service

```tsx
import { exportService } from '@/lib/api';

// Export and download
await exportService.exportAndDownload({
  calculationId: 'calc-123',
  format: 'pdf',
  options: { includeAmortization: true }
}, 'my-calculation.pdf');
```

## Authentication Guards

### Protected Routes

```tsx
import { withAuth } from '@/lib/api';

const ProtectedComponent = withAuth(function MyComponent() {
  return <div>This requires authentication</div>;
});
```

### Premium Features

```tsx
import { useAuthGuard } from '@/lib/api';

function MyComponent() {
  const { requirePremium } = useAuthGuard();

  const handlePremiumFeature = () => {
    requirePremium(
      () => {
        // Premium user action
        console.log('Access granted');
      },
      () => {
        // Fallback for non-premium users
        alert('This feature requires a premium subscription');
      }
    );
  };

  return <button onClick={handlePremiumFeature}>Premium Feature</button>;
}
```

## Error Handling

### Global Error Handling

The API client automatically handles common errors. For custom error handling:

```tsx
import { ApiError } from '@/lib/api';

try {
  await calculationService.createCalculation(data);
} catch (error) {
  if (error instanceof ApiError) {
    console.log('API Error:', error.message, error.status);
  } else {
    console.log('Unknown error:', error);
  }
}
```

### Loading States

All hooks provide loading states:

```tsx
function MyComponent() {
  const { calculations, isLoading, error } = useCalculations();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return <CalculationsList calculations={calculations} />;
}
```

## Type Safety

All API operations are fully typed:

```tsx
import type { CreateCalculationData, Calculation } from '@/lib/api';

const calculationData: CreateCalculationData = {
  title: 'My Calculation',
  loanAmount: 300000,
  interestRate: 3.5,
  loanTerm: 30,
  // TypeScript will enforce correct types
};

const calculation: Calculation = await calculationService.createCalculation(calculationData);
```

## Advanced Usage

### Custom API Client Configuration

```tsx
import { ApiClient } from '@/lib/api';

// Create custom client instance
const customClient = new ApiClient('https://api.example.com', 60000);

// Add custom interceptors
customClient.addRequestInterceptor(async (config) => {
  config.headers['X-Custom-Header'] = 'value';
  return config;
});
```

### Manual Token Management

```tsx
import { apiClient } from '@/lib/api';

// Get current auth token
const token = await apiClient.getAuthToken();

// Check if authenticated
const isAuth = apiClient.isAuthenticated();

// Health check
const isHealthy = await apiClient.healthCheck();
```

## Integration with Existing Code

### Migrating from Local Storage

Replace local storage operations with API calls:

```tsx
// Before
const calculations = JSON.parse(localStorage.getItem('calculations') || '[]');

// After
const { calculations } = useCalculations();
```

### Integrating with Existing Components

Update existing components to use the new API:

```tsx
// In existing LoanInputForm component
import { useCalculations } from '@/lib/api';

function LoanInputForm() {
  const { createCalculation } = useCalculations();

  const handleSubmit = async (formData) => {
    await createCalculation({
      title: formData.name,
      loanAmount: formData.principal,
      interestRate: formData.interestRate,
      loanTerm: formData.loanTerm,
    });
  };

  // ... rest of component
}
```

## Best Practices

1. **Use Hooks**: Prefer React hooks over direct service calls for better state management
2. **Handle Loading States**: Always show loading indicators during API calls
3. **Error Boundaries**: Implement error boundaries for graceful error handling
4. **Type Safety**: Leverage TypeScript types for better development experience
5. **Authentication**: Use authentication guards for protected features
6. **Caching**: The hooks automatically handle caching and state updates

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure API base URL is correct and CORS is configured on backend
2. **Authentication Failures**: Check Firebase configuration and environment variables
3. **Type Errors**: Ensure all API types are imported correctly
4. **Network Errors**: Verify API endpoint availability and network connectivity

### Debug Mode

Enable debug logging:

```tsx
// In development, API errors are logged to console
// Check browser dev tools for detailed error information
```

## Next Steps

1. **Implement UI Components**: Create login/register forms using the auth context
2. **Add Premium Features**: Use authentication guards to gate premium functionality
3. **Integrate Payments**: Implement subscription management UI using payment hooks
4. **Error Handling**: Add global error boundaries and user-friendly error messages
5. **Loading States**: Implement consistent loading indicators across the app