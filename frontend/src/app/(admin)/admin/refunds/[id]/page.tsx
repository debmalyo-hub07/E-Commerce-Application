"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Banknote,
  Package,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface RefundItem {
  productSnapshot: Record<string, unknown>;
  quantity: number;
  totalPrice: number;
  unitPrice: number;
}

interface Refund {
  _id: string;
  orderNumber: string;
  totalAmount: number;
  subtotal: number;
  gstAmount: number;
  shippingAmount: number;
  discountAmount: number;
  paymentStatus: string;
  orderStatus: string;
  items: RefundItem[];
  userId: { name: string; email: string };
  addressSnapshot: Record<string, unknown>;
  createdAt: string;
}

export default function AdminRefundDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [refund, setRefund] = useState<Refund | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!session || !params.id) return;

    const fetchRefund = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/refunds/${params.id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch refund details");
        }

        const data = await response.json();
        setRefund(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load refund");
      } finally {
        setLoading(false);
      }
    };

    fetchRefund();
  }, [session, params.id]);

  const handleApprove = async () => {
    try {
      setProcessing(true);
      const response = await fetch(`/api/admin/refunds/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED", note }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to approve refund");
      }

      alert("Refund approved successfully");
      router.push("/admin/refunds");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve refund");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    try {
      setProcessing(true);
      const response = await fetch(`/api/admin/refunds/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED", note }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to reject refund");
      }

      alert("Refund rejected");
      router.push("/admin/refunds");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject refund");
    } finally {
      setProcessing(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to access admin panel.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !refund) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Refund not found"}</p>
          <Link href="/admin/refunds" className="text-primary hover:underline">
            Back to Refunds
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "REFUNDED":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
            <CheckCircle2 className="w-3 h-3" /> Refunded
          </span>
        );
      case "REJECTED":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-5xl mx-auto pb-10"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/refunds"
            className="p-2 rounded-xl hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Refund Request
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Order #{refund.orderNumber}
            </p>
          </div>
        </div>
        {getStatusBadge(refund.paymentStatus)}
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-800 font-medium text-sm flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4" /> {error}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items
              </h2>
            </div>
            <div className="divide-y divide-border">
              {refund.items.map((item, idx) => (
                <div key={idx} className="p-4 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                    <Package className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {(item.productSnapshot as Record<string, string>)?.name ||
                        "Product"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity} × ₹{item.unitPrice?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">
                      ₹{item.totalPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 bg-muted/20 border-t border-border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground font-medium">
                  ₹{refund.subtotal?.toFixed(2) || "0.00"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">GST</span>
                <span className="text-foreground font-medium">
                  ₹{refund.gstAmount?.toFixed(2) || "0.00"}
                </span>
              </div>
              {refund.shippingAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-foreground font-medium">
                    ₹{refund.shippingAmount.toFixed(2)}
                  </span>
                </div>
              )}
              {refund.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span className="font-medium">
                    -₹{refund.discountAmount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <span>Refund Amount</span>
                <span className="text-primary">
                  ₹{refund.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Decision
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Admin Note (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note for the customer..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-foreground resize-none"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleApprove}
                  disabled={processing || refund.paymentStatus !== "REFUND_INITIATED"}
                  className="flex-1 rounded-xl bg-green-600 hover:bg-green-700"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Approve Refund
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={processing || refund.paymentStatus !== "REFUND_INITIATED"}
                  variant="destructive"
                  className="flex-1 rounded-xl"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Refund
                    </>
                  )}
                </Button>
              </div>

              {refund.paymentStatus !== "REFUND_INITIATED" && (
                <p className="text-sm text-muted-foreground text-center">
                  This refund request has already been processed.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Name</p>
                <p className="font-semibold text-foreground">
                  {refund.userId.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Email</p>
                <p className="font-semibold text-foreground">
                  {refund.userId.email}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Timeline
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Requested On
                </p>
                <p className="font-semibold text-foreground">
                  {new Date(refund.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Order Status
                </p>
                <p className="font-semibold text-foreground capitalize">
                  {refund.orderStatus.toLowerCase().replace(/_/g, " ")}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Payment Status
                </p>
                <div className="mt-1">{getStatusBadge(refund.paymentStatus)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}