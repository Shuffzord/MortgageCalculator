export interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
  priceId?: string;
  quantity?: number;
}

export interface PaymentHistory {
  id: string;
  userId: string;
  stripePaymentIntentId: string;
  stripeInvoiceId?: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed' | 'canceled' | 'requires_action';
  description?: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface CreateCheckoutSessionRequest {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  mode?: 'payment' | 'subscription' | 'setup';
}

export interface CreateCheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface SubscriptionStatus {
  subscription: Subscription | null;
  isActive: boolean;
  daysUntilExpiry?: number;
  gracePeriodActive?: boolean;
}

export interface CustomerPortalResponse {
  url: string;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

// Use Stripe's native types for better compatibility
export type StripeCustomer = import('stripe').Stripe.Customer;
export type StripeSubscription = import('stripe').Stripe.Subscription;
export type StripeInvoice = import('stripe').Stripe.Invoice;
export type StripeEvent = import('stripe').Stripe.Event;


export interface PaymentMethodInfo {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

// Stripe webhook event types we handle
export enum StripeWebhookEventType {
  CUSTOMER_SUBSCRIPTION_CREATED = 'customer.subscription.created',
  CUSTOMER_SUBSCRIPTION_UPDATED = 'customer.subscription.updated',
  CUSTOMER_SUBSCRIPTION_DELETED = 'customer.subscription.deleted',
  INVOICE_PAYMENT_SUCCEEDED = 'invoice.payment_succeeded',
  INVOICE_PAYMENT_FAILED = 'invoice.payment_failed',
  CUSTOMER_CREATED = 'customer.created',
  CUSTOMER_UPDATED = 'customer.updated',
  PAYMENT_INTENT_SUCCEEDED = 'payment_intent.succeeded',
  PAYMENT_INTENT_PAYMENT_FAILED = 'payment_intent.payment_failed'
}

// Grace period configuration
export interface GracePeriodConfig {
  daysAfterFailure: number;
  maxRetries: number;
}

export const DEFAULT_GRACE_PERIOD: GracePeriodConfig = {
  daysAfterFailure: 7,
  maxRetries: 3
};

// Subscription plans configuration
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  priceId: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'premium_monthly',
    name: 'Premium Monthly',
    description: 'Full access to all premium features',
    priceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || 'price_premium_monthly',
    amount: 999, // $9.99 in cents
    currency: 'usd',
    interval: 'month',
    features: [
      'Unlimited calculations',
      'Advanced comparison tools',
      'Export to PDF',
      'Priority support',
      'Advanced analytics'
    ]
  },
  {
    id: 'premium_yearly',
    name: 'Premium Yearly',
    description: 'Full access to all premium features (2 months free)',
    priceId: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || 'price_premium_yearly',
    amount: 9999, // $99.99 in cents (2 months free)
    currency: 'usd',
    interval: 'year',
    features: [
      'Unlimited calculations',
      'Advanced comparison tools',
      'Export to PDF',
      'Priority support',
      'Advanced analytics',
      '2 months free'
    ]
  }
];