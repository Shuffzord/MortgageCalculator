import React, { useState, useEffect } from 'react';
import { Download, Calendar, CreditCard, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { paymentService } from '@/lib/api/services/paymentService';
import type { PaymentHistory } from '@/lib/api/types';

interface BillingHistoryProps {
  className?: string;
}

export function BillingHistory({ className }: BillingHistoryProps) {
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentHistory();
  }, []);

  const loadPaymentHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const paymentHistory = await paymentService.getPaymentHistory({ limit: 20 });
      setPayments(paymentHistory);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment history');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case 'canceled':
        return (
          <Badge variant="secondary">
            Canceled
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const downloadInvoice = async (paymentId: string) => {
    try {
      // This would typically call an API to get the invoice download URL
      // For now, we'll show a placeholder
      console.log('Download invoice for payment:', paymentId);
      // const invoiceUrl = await paymentService.getInvoiceUrl(paymentId);
      // window.open(invoiceUrl, '_blank');
    } catch (err) {
      setError('Failed to download invoice');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading billing history...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Billing History
          </CardTitle>
          <CardDescription>
            View your payment history and download invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payment history</h3>
              <p className="text-gray-600">
                Your payment history will appear here once you make your first payment.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invoice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {formatDate(payment.createdAt.toString())}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {payment.description || 'Premium Subscription'}
                          </p>
                          <p className="text-sm text-gray-600">
                            Payment ID: {payment.id.slice(-8)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {formatAmount(payment.amount, payment.currency)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(payment.status)}
                      </TableCell>
                      <TableCell>
                        {payment.status === 'succeeded' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadInvoice(payment.id)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Card */}
      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {payments.filter(p => p.status === 'succeeded').length}
                </p>
                <p className="text-sm text-gray-600">Successful Payments</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {formatAmount(
                    payments
                      .filter(p => p.status === 'succeeded')
                      .reduce((sum, p) => sum + p.amount, 0),
                    payments[0]?.currency || 'USD'
                  )}
                </p>
                <p className="text-sm text-gray-600">Total Paid</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-600">
                  {payments.filter(p => p.status === 'failed').length}
                </p>
                <p className="text-sm text-gray-600">Failed Payments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}