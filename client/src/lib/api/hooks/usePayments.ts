import { useState, useEffect, useCallback } from 'react';
import { paymentService } from '../services/paymentService';
import type {
  Subscription,
  PaymentHistory,
  CreateCheckoutSessionRequest,
  SubscriptionStatus,
  PaymentMethodInfo,
  SubscriptionPlan,
  PaginationParams,
} from '../types';

// Hook for managing subscription
export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [currentSub, subStatus] = await Promise.all([
        paymentService.getCurrentSubscription(),
        paymentService.getSubscriptionStatus(),
      ]);
      
      setSubscription(currentSub);
      setStatus(subStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const createCheckoutSession = useCallback(async (request: CreateCheckoutSessionRequest) => {
    try {
      setError(null);
      const session = await paymentService.createCheckoutSession(request);
      return session;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create checkout session');
      return null;
    }
  }, []);

  const cancelSubscription = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const cancelledSub = await paymentService.cancelSubscription();
      setSubscription(cancelledSub);
      // Refresh status
      const newStatus = await paymentService.getSubscriptionStatus();
      setStatus(newStatus);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
      return false;
    }
  }, []);

  const resumeSubscription = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const resumedSub = await paymentService.resumeSubscription();
      setSubscription(resumedSub);
      // Refresh status
      const newStatus = await paymentService.getSubscriptionStatus();
      setStatus(newStatus);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume subscription');
      return false;
    }
  }, []);

  const updateSubscription = useCallback(async (priceId: string): Promise<boolean> => {
    try {
      setError(null);
      const updatedSub = await paymentService.updateSubscription(priceId);
      setSubscription(updatedSub);
      // Refresh status
      const newStatus = await paymentService.getSubscriptionStatus();
      setStatus(newStatus);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subscription');
      return false;
    }
  }, []);

  const openCustomerPortal = useCallback(async (returnUrl?: string): Promise<boolean> => {
    try {
      setError(null);
      const portalResponse = await paymentService.getCustomerPortalUrl(returnUrl);
      paymentService.openCustomerPortal(portalResponse.url);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open customer portal');
      return false;
    }
  }, []);

  const refresh = useCallback(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    subscription,
    status,
    isLoading,
    error,
    createCheckoutSession,
    cancelSubscription,
    resumeSubscription,
    updateSubscription,
    openCustomerPortal,
    refresh,
  };
}

// Hook for payment history
export function usePaymentHistory(params?: PaginationParams) {
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const history = await paymentService.getPaymentHistory(params);
      setPayments(history);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payment history');
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchPaymentHistory();
  }, [fetchPaymentHistory]);

  const refresh = useCallback(() => {
    fetchPaymentHistory();
  }, [fetchPaymentHistory]);

  return {
    payments,
    isLoading,
    error,
    refresh,
  };
}

// Hook for payment methods
export function usePaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentMethods = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const methods = await paymentService.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payment methods');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  const addPaymentMethod = useCallback(async (paymentMethodId: string): Promise<PaymentMethodInfo | null> => {
    try {
      setError(null);
      const newMethod = await paymentService.addPaymentMethod(paymentMethodId);
      setPaymentMethods(prev => [...prev, newMethod]);
      return newMethod;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add payment method');
      return null;
    }
  }, []);

  const removePaymentMethod = useCallback(async (paymentMethodId: string): Promise<boolean> => {
    try {
      setError(null);
      await paymentService.removePaymentMethod(paymentMethodId);
      setPaymentMethods(prev => prev.filter(method => method.id !== paymentMethodId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove payment method');
      return false;
    }
  }, []);

  const setDefaultPaymentMethod = useCallback(async (paymentMethodId: string): Promise<boolean> => {
    try {
      setError(null);
      await paymentService.setDefaultPaymentMethod(paymentMethodId);
      // Refresh the list to get updated default status
      await fetchPaymentMethods();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set default payment method');
      return false;
    }
  }, [fetchPaymentMethods]);

  const refresh = useCallback(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  return {
    paymentMethods,
    isLoading,
    error,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    refresh,
  };
}

// Hook for subscription plans
export function useSubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const subscriptionPlans = await paymentService.getSubscriptionPlans();
      setPlans(subscriptionPlans);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription plans');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const refresh = useCallback(() => {
    fetchPlans();
  }, [fetchPlans]);

  return {
    plans,
    isLoading,
    error,
    refresh,
  };
}

// Hook for upcoming invoice
export function useUpcomingInvoice() {
  const [invoice, setInvoice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUpcomingInvoice = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const upcomingInvoice = await paymentService.getUpcomingInvoice();
      setInvoice(upcomingInvoice);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch upcoming invoice');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUpcomingInvoice();
  }, [fetchUpcomingInvoice]);

  const refresh = useCallback(() => {
    fetchUpcomingInvoice();
  }, [fetchUpcomingInvoice]);

  return {
    invoice,
    isLoading,
    error,
    refresh,
  };
}

// Hook for promo codes
export function usePromoCode() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyPromoCode = useCallback(async (promoCode: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await paymentService.applyPromoCode(promoCode);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply promo code');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    applyPromoCode,
  };
}