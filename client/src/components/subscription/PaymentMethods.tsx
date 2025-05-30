import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Trash2, Star, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { paymentService } from '@/lib/api/services/paymentService';
import type { PaymentMethodInfo } from '@/lib/api/types';

interface PaymentMethodsProps {
  className?: string;
}

export function PaymentMethods({ className }: PaymentMethodsProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [methodToDelete, setMethodToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const methods = await paymentService.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment methods');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    try {
      // Open Stripe customer portal for adding payment methods
      const portalResponse = await paymentService.getCustomerPortalUrl(window.location.href);
      window.open(portalResponse.url, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open payment method setup');
    }
  };

  const handleDeletePaymentMethod = async () => {
    if (!methodToDelete) return;

    try {
      setIsDeleting(true);
      await paymentService.removePaymentMethod(methodToDelete);
      await loadPaymentMethods();
      setShowDeleteModal(false);
      setMethodToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete payment method');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      await paymentService.setDefaultPaymentMethod(paymentMethodId);
      await loadPaymentMethods();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set default payment method');
    }
  };

  const getCardBrand = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return '💳 Visa';
      case 'mastercard':
        return '💳 Mastercard';
      case 'amex':
        return '💳 American Express';
      case 'discover':
        return '💳 Discover';
      default:
        return '💳 ' + brand.charAt(0).toUpperCase() + brand.slice(1);
    }
  };

  const confirmDelete = (methodId: string) => {
    setMethodToDelete(methodId);
    setShowDeleteModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading payment methods...</span>
      </div>
    );
  }

  return (
    <>
      <div className={`space-y-6 ${className}`}>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Methods
                </CardTitle>
                <CardDescription>
                  Manage your saved payment methods
                </CardDescription>
              </div>
              <Button onClick={handleAddPaymentMethod}>
                <Plus className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {paymentMethods.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No payment methods</h3>
                <p className="text-gray-600 mb-4">
                  Add a payment method to manage your subscription billing.
                </p>
                <Button onClick={handleAddPaymentMethod}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Payment Method
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {method.card ? getCardBrand(method.card.brand) : method.type}
                          </span>
                          {method.card && (
                            <>
                              <span className="text-gray-500">•••• {method.card.last4}</span>
                              <Badge variant="secondary" className="text-xs">
                                Default
                              </Badge>
                            </>
                          )}
                        </div>
                        {method.card && (
                          <p className="text-sm text-gray-600">
                            Expires {method.card.exp_month.toString().padStart(2, '0')}/{method.card.exp_year}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(method.id)}
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Set Default
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => confirmDelete(method.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CreditCard className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Secure Payment Processing</h4>
                <p className="text-sm text-blue-800">
                  Your payment information is securely stored and processed by Stripe. 
                  We never store your full credit card details on our servers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payment Method</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment method? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePaymentMethod}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}