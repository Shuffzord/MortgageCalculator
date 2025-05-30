import { apiClient, withLoading } from '../client';
import type {
  ApiResponse,
  Subscription,
  PaymentHistory,
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
  SubscriptionStatus,
  CustomerPortalResponse,
  PaymentMethodInfo,
  SubscriptionPlan,
  PaginationParams,
} from '../types';

export class PaymentService {
  // Create checkout session for subscription
  async createCheckoutSession(request: CreateCheckoutSessionRequest): Promise<CreateCheckoutSessionResponse> {
    const response = await apiClient.post<CreateCheckoutSessionResponse>('/payments/checkout', request);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create checkout session');
    }
    return response.data;
  }

  // Get subscription status
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    const response = await apiClient.get<SubscriptionStatus>('/subscription/status');
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get subscription status');
    }
    return response.data;
  }

  // Get current subscription
  async getCurrentSubscription(): Promise<Subscription | null> {
    const response = await apiClient.get<Subscription>('/subscription/current');
    if (!response.success) {
      if (response.error?.includes('No active subscription')) {
        return null;
      }
      throw new Error(response.error || 'Failed to get current subscription');
    }
    return response.data || null;
  }

  // Cancel subscription
  async cancelSubscription(): Promise<Subscription> {
    const response = await apiClient.post<Subscription>('/subscription/cancel');
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to cancel subscription');
    }
    return response.data;
  }

  // Resume subscription
  async resumeSubscription(): Promise<Subscription> {
    const response = await apiClient.post<Subscription>('/subscription/resume');
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to resume subscription');
    }
    return response.data;
  }

  // Update subscription
  async updateSubscription(priceId: string): Promise<Subscription> {
    const response = await apiClient.put<Subscription>('/subscription/update', { priceId });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update subscription');
    }
    return response.data;
  }

  // Get customer portal URL
  async getCustomerPortalUrl(returnUrl?: string): Promise<CustomerPortalResponse> {
    const response = await apiClient.post<CustomerPortalResponse>('/payments/portal', {
      returnUrl,
    });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get customer portal URL');
    }
    return response.data;
  }

  // Get payment history
  async getPaymentHistory(params?: PaginationParams): Promise<PaymentHistory[]> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/payments/history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<PaymentHistory[]>(endpoint);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get payment history');
    }
    return response.data;
  }

  // Get payment methods
  async getPaymentMethods(): Promise<PaymentMethodInfo[]> {
    const response = await apiClient.get<PaymentMethodInfo[]>('/payments/methods');
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get payment methods');
    }
    return response.data;
  }

  // Add payment method
  async addPaymentMethod(paymentMethodId: string): Promise<PaymentMethodInfo> {
    const response = await apiClient.post<PaymentMethodInfo>('/payments/methods', {
      paymentMethodId,
    });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to add payment method');
    }
    return response.data;
  }

  // Remove payment method
  async removePaymentMethod(paymentMethodId: string): Promise<void> {
    const response = await apiClient.delete(`/payments/methods/${paymentMethodId}`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to remove payment method');
    }
  }

  // Set default payment method
  async setDefaultPaymentMethod(paymentMethodId: string): Promise<void> {
    const response = await apiClient.put('/payments/methods/default', {
      paymentMethodId,
    });
    if (!response.success) {
      throw new Error(response.error || 'Failed to set default payment method');
    }
  }

  // Get available subscription plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const response = await apiClient.get<SubscriptionPlan[]>('/payments/plans', {
      requireAuth: false,
    });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get subscription plans');
    }
    return response.data;
  }

  // Get upcoming invoice
  async getUpcomingInvoice(): Promise<any> {
    const response = await apiClient.get('/payments/invoice/upcoming');
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get upcoming invoice');
    }
    return response.data;
  }

  // Apply promo code
  async applyPromoCode(promoCode: string): Promise<any> {
    const response = await apiClient.post('/payments/promo', { promoCode });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to apply promo code');
    }
    return response.data;
  }

  // Helper methods with loading states
  async createCheckoutSessionWithLoading(
    request: CreateCheckoutSessionRequest,
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<CreateCheckoutSessionResponse | null> {
    return withLoading(() => apiClient.post<CreateCheckoutSessionResponse>('/payments/checkout', request), setLoading, setError);
  }

  async getSubscriptionStatusWithLoading(
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<SubscriptionStatus | null> {
    return withLoading(() => apiClient.get<SubscriptionStatus>('/subscription/status'), setLoading, setError);
  }

  async getCurrentSubscriptionWithLoading(
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<Subscription | null> {
    try {
      return await withLoading(() => apiClient.get<Subscription>('/subscription/current'), setLoading, setError);
    } catch (error) {
      // Handle case where user has no subscription
      if (error instanceof Error && error.message.includes('No active subscription')) {
        return null;
      }
      throw error;
    }
  }

  async cancelSubscriptionWithLoading(
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<Subscription | null> {
    return withLoading(() => apiClient.post<Subscription>('/subscription/cancel'), setLoading, setError);
  }

  async resumeSubscriptionWithLoading(
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<Subscription | null> {
    return withLoading(() => apiClient.post<Subscription>('/subscription/resume'), setLoading, setError);
  }

  async getCustomerPortalUrlWithLoading(
    returnUrl?: string,
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<CustomerPortalResponse | null> {
    return withLoading(() => apiClient.post<CustomerPortalResponse>('/payments/portal', {
      returnUrl,
    }), setLoading, setError);
  }

  async getPaymentHistoryWithLoading(
    params?: PaginationParams,
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<PaymentHistory[] | null> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/payments/history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return withLoading(() => apiClient.get<PaymentHistory[]>(endpoint), setLoading, setError);
  }

  async getSubscriptionPlansWithLoading(
    setLoading?: (loading: boolean) => void,
    setError?: (error: string | null) => void
  ): Promise<SubscriptionPlan[] | null> {
    return withLoading(() => apiClient.get<SubscriptionPlan[]>('/payments/plans', {
      requireAuth: false,
    }), setLoading, setError);
  }

  // Utility methods
  redirectToCheckout(sessionId: string): void {
    // This would typically use Stripe's redirectToCheckout method
    // For now, we'll construct the URL manually
    const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    if (stripePublicKey) {
      window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;
    } else {
      throw new Error('Stripe public key not configured');
    }
  }

  openCustomerPortal(portalUrl: string): void {
    window.open(portalUrl, '_blank');
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100); // Stripe amounts are in cents
  }

  formatSubscriptionInterval(interval: string): string {
    switch (interval) {
      case 'month':
        return 'Monthly';
      case 'year':
        return 'Yearly';
      default:
        return interval;
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();