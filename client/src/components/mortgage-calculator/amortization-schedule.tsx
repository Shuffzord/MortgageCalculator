import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/mortgage-calculator";
import { PaymentData } from "@/lib/types";
import { LoanDetails } from "@/lib/mortgage-calculator";
import { cn } from "@/lib/utils";
import { getCurrencySymbol } from "@/components/ui/currency-selector";

interface AmortizationScheduleProps {
  schedule: PaymentData[];
  loanDetails: LoanDetails;
}

export default function AmortizationSchedule({ schedule, loanDetails }: AmortizationScheduleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Calculate pagination information
  const totalPages = Math.ceil(schedule.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, schedule.length);
  const currentItems = schedule.slice(startIndex, endIndex);

  // Calculate date from payment number
  const getPaymentDate = (paymentNum: number) => {
    const startDate = loanDetails.startDate || new Date();
    const paymentDate = new Date(startDate);
    paymentDate.setMonth(paymentDate.getMonth() + paymentNum - 1);
    return formatDate(paymentDate);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Amortization Schedule</h2>
        <Button 
          variant="ghost" 
          onClick={toggleExpand}
          className="text-sm text-primary flex items-center"
        >
          <span className="material-icons text-sm mr-1">
            {isExpanded ? "expand_less" : "expand_more"}
          </span>
          {isExpanded ? "Hide Details" : "Show Details"}
        </Button>
      </div>
      
      {isExpanded && (
        <div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-[80px]">Payment #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Interest</TableHead>
                  <TableHead>Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.map((item) => (
                  <TableRow 
                    key={item.payment} 
                    className={cn(item.isOverpayment && "bg-green-50")}
                  >
                    <TableCell className="text-sm text-gray-500">
                      {item.payment}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {item.paymentDate ? formatDate(item.paymentDate) : getPaymentDate(item.payment)}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-900 financial-figure">
                      {formatCurrency(item.monthlyPayment, 'en-US', loanDetails.currency || 'USD')}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 financial-figure">
                      {formatCurrency(item.principalPayment, 'en-US', loanDetails.currency || 'USD')}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 financial-figure">
                      {formatCurrency(item.interestPayment, 'en-US', loanDetails.currency || 'USD')}
                    </TableCell>
                    <TableCell className="text-sm text-gray-900 financial-figure">
                      {formatCurrency(item.balance, 'en-US', loanDetails.currency || 'USD')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="px-6 py-4 flex justify-between">
            <Button 
              variant="outline" 
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className={cn(currentPage === 1 && "opacity-50 cursor-not-allowed")}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-500 flex items-center">
              Page {currentPage} of {totalPages}
            </span>
            <Button 
              variant="outline" 
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={cn(currentPage === totalPages && "opacity-50 cursor-not-allowed")}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
