"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/pagination";
import { format, addMonths, addYears } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { jsPDF } from "jspdf";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// Type definitions
interface Payment {
  _id: string;
  transactionId: string;
  createdAt: string;
  updatedAt: string;
  planTitle: string;
  planValid: string; // monthly | yearly
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
}

interface Meta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface ApiResponse {
  success: boolean;
  data: any[];
  meta: Meta;
}

interface CustomSession {
  user?: { id?: string };
  accessToken?: string;
}

export function PaymentHistory() {
  const { data: session } = useSession() as { data: CustomSession | null };
  const token = session?.accessToken;
  const userId = session?.user?.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentData, setPaymentData] = useState<Payment[]>([]);
  const [meta, setMeta] = useState<Meta>({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refund modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isRefunding, setIsRefunding] = useState(false);

  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const itemsPerPage = 10;

  // Fetch payment history
  useEffect(() => {
    const fetchPaymentData = async () => {
      if (!token || !userId) {
        setError("Please log in to view payment history.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/payments/user/${userId}?page=${currentPage}&limit=${itemsPerPage}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.ok) throw new Error("Failed to fetch payment history.");

        const result: ApiResponse = await response.json();
        if (result.success) {
          const transformedData: Payment[] = result.data.map((item) => ({
            _id: item._id,
            transactionId: item.transactionId,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            planTitle: item.planId.title,
            planValid: item.planId.valid || "monthly",
            amount: item.amount,
            paymentMethod: item.paymentMethod,
            paymentStatus: item.paymentStatus,
          }));
          setPaymentData(transformedData);
          setMeta(result.meta);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Error fetching payment history."
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchPaymentData();
  }, [token, userId, currentPage]);

  const computeValidTill = (updatedAt: string, valid: string) => {
    const base = new Date(updatedAt);
    return valid === "yearly" ? addYears(base, 1) : addMonths(base, 1);
  };

  // Refund handler (after modal confirmation)
  const confirmRefund = async () => {
    if (!selectedPayment || !token) return;

    setIsRefunding(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/payments/paypal/refund-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ paymentId: selectedPayment._id }),
        }
      );

      const data = await res.json();

      if (data.success) {
        alert("Refund processed successfully!");
        setIsModalOpen(false);
        router.refresh();
      } else {
        toast.error(`Refund failed: ${data.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error processing refund.");
    } finally {
      setIsRefunding(false);
    }
  };

  const generateReceipt = (payment: Payment) => {
    try {
      const doc = new jsPDF({ unit: "pt", format: "A4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 40;
      const primary = "#4B98DE";
      let y = 50;

      doc.setFillColor(primary);
      doc.rect(0, 0, pageWidth, 70, "F");
      doc.setTextColor("#ffffff");
      doc.setFontSize(18);
      doc.text("Elevator Video Pitch©", margin, 44);
      doc.setFontSize(12);
      doc.text("RECEIPT", pageWidth - margin, 44, { align: "right" });

      y = 90;
      doc.setTextColor("#333333");
      doc.setFontSize(10);
      doc.text("124 City Road, London EC1V 2NX", margin, y);
      doc.text("clientsupport@evpitch.com", margin, y + 14);
      doc.text("+44 0203 954 2530", margin, y + 28);

      const validTill = computeValidTill(payment.updatedAt, payment.planValid);
      y += 60;
      doc.text(`Transaction ID: ${payment.transactionId}`, margin, y);
      doc.text(`Plan: ${payment.planTitle} (${payment.planValid})`, margin, y + 14);
      doc.text(`Payment Method: ${payment.paymentMethod}`, margin, y + 28);
      doc.text(`Amount: $${payment.amount.toFixed(2)}`, margin, y + 42);
      doc.text(`Status: ${payment.paymentStatus}`, margin, y + 56);
      doc.text(`Valid Till: ${format(validTill, "PPP")}`, margin, y + 70);

      doc.save(`receipt_${payment.transactionId}.pdf`);
    } catch (e) {
      console.error("Failed to generate receipt", e);
      alert("Could not generate receipt. Ensure jspdf is installed.");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Payment History</h2>

      {error && <p className="text-center text-red-500">{error}</p>}

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : paymentData.length === 0 ? (
        <p className="text-center text-gray-600">
          No payment history available.
        </p>
      ) : (
        <div className="-mx-3 sm:mx-0">
          <div className="overflow-x-auto md:overflow-visible">
            <Table
              aria-label="Payment history table"
              className="min-w-[720px] md:min-w-0 w-full"
            >
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Refund</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentData.map((payment) => (
                  <TableRow key={payment._id}>
                    <TableCell className="text-xs sm:text-sm">
                      {payment.transactionId}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {format(new Date(payment.updatedAt), "PPp")}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {payment.planTitle}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      ${payment.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="capitalize text-xs sm:text-sm">
                      {payment.paymentStatus}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => generateReceipt(payment)}>
                        Download
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={payment.paymentStatus === "refunded"}
                        onClick={() => {
                          setSelectedPayment(payment);
                          setIsModalOpen(true);
                        }}
                      >
                        {payment.paymentStatus === "refunded"
                          ? "Refunded"
                          : "Refund"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="px-6 py-4 flex justify-center">
          <Pagination
            currentPage={meta.currentPage}
            totalPages={meta.totalPages}
            onPageChange={(page: number) => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("page", page.toString());
              router.push(`?${params.toString()}`);
            }}
            isLoading={isLoading}
            totalItems={meta.totalItems}
            itemsPerPage={meta.itemsPerPage}
          />
        </div>
      )}

      {/* Refund Confirmation Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Refund</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mt-2">
            Are you sure you want to refund this payment?
            <br />
            <span className="font-semibold text-gray-800">
              {selectedPayment?.transactionId}
            </span>
          </p>
          <DialogFooter className="mt-4 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isRefunding}
            >
              No
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRefund}
              disabled={isRefunding}
            >
              {isRefunding ? "Processing..." : "Yes, Refund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
