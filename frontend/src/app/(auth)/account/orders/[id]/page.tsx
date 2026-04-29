"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle, 
  ChevronLeft, 
  Download,
  CreditCard,
  MapPin,
  Calendar,
  IndianRupee,
  ShieldCheck,
  PackageCheck
} from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency } from "@nexmart/shared/utils";

// Lazily load the Invoice PDF button (keeps @react-pdf/renderer out of SSR bundle)
const InvoiceButton = dynamic(
  () => import("@/components/account/InvoiceButton"),
  { ssr: false }
);

interface OrderItem {
  _id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  gstPercent: number;
  totalPrice: number;
  productSnapshot: Record<string, any>;
}

interface Order {
  _id: string;
  orderNumber: string;
  userId: string;
  addressId: string;
  addressSnapshot: Record<string, any>;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  gstAmount: number;
  shippingAmount: number;
  totalAmount: number;
  couponCode?: string | null;
  paymentMethod: "RAZORPAY" | "COD";
  paymentStatus: string;
  orderStatus: string;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  trackingNumber?: string | null;
  createdAt: string;
  updatedAt: string;
}

const ORDER_STEPS = [
  { id: 'PENDING', label: 'Placed', icon: Clock },
  { id: 'CONFIRMED', label: 'Confirmed', icon: ShieldCheck },
  { id: 'PROCESSING', label: 'Processing', icon: Package },
  { id: 'SHIPPED', label: 'Shipped', icon: Truck },
  { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck },
  { id: 'DELIVERED', label: 'Delivered', icon: PackageCheck },
];

export default function OrderDetail() {
  const params = useParams();
  const { data: session } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelForm, setShowCancelForm] = useState(false);

  useEffect(() => {
    if (!params.id) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/user/orders/${params.id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch order details");
        }

        const data = await response.json();
        setOrder(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params.id]);

  const canCancel = useMemo(() => {
    if (!order) return false;
    const allowedStatuses = ["PENDING", "CONFIRMED"];
    if (!allowedStatuses.includes(order.orderStatus)) return false;

    const createdAtTime = new Date(order.createdAt).getTime();
    const ageMs = Date.now() - createdAtTime;
    return ageMs < 60 * 60 * 1000; // 1 hour window
  }, [order]);

  const handleCancel = async () => {
    try {
      setCancelling(true);
      const response = await fetch(`/api/user/orders/${params.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to cancel order");
      }

      setOrder(prev => prev ? { ...prev, orderStatus: "CANCELLED" } : null);
      setShowCancelForm(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground animate-pulse font-medium">Fetching order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card border border-border p-8 rounded-3xl text-center shadow-xl">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
          <p className="text-muted-foreground mb-8">{error || "We couldn't find the order you're looking for."}</p>
          <Link href="/account/orders" className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25">
            <ChevronLeft className="w-5 h-5" /> Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const isCancelled = order.orderStatus === 'CANCELLED';
  const isRefunded = order.orderStatus === 'REFUNDED';
  
  // Prevent negative values if status is CANCELLED/REFUNDED which aren't in the ORDER_STEPS array
  let currentStepIndex = ORDER_STEPS.findIndex(s => s.id === order.orderStatus);
  if (currentStepIndex === -1) {
    currentStepIndex = 0;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors mb-4 group">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to My Orders
          </Link>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-4">
            Order <span className="text-primary font-mono select-all">#{order.orderNumber}</span>
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-muted-foreground font-medium">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-border"></span>
            <span className="flex items-center gap-1.5"><CreditCard className="w-4 h-4" /> {order.paymentMethod} • {order.paymentStatus}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {(order.paymentStatus === 'PAYMENT_VERIFIED' || order.paymentStatus === 'COD_COLLECTED' || order.orderStatus === 'DELIVERED') && (
            <InvoiceButton order={order} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Tracking & Items */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Tracking Timeline */}
          <section className="bg-card border border-border rounded-3xl p-8 shadow-sm relative overflow-hidden">
            {isCancelled && (
              <div className="absolute inset-0 bg-destructive/5 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <div className="bg-destructive text-destructive-foreground px-6 py-2 rounded-full font-bold shadow-xl rotate-[-5deg] border-2 border-white/20">
                  ORDER CANCELLED
                </div>
              </div>
            )}
            
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              <Truck className="w-6 h-6 text-primary" /> Delivery Progress
            </h3>

            <div className="relative">
              {/* Progress Line */}
              <div className="absolute left-[19px] top-2 bottom-2 w-1 bg-muted rounded-full">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${(currentStepIndex / (ORDER_STEPS.length - 1)) * 100}%` }}
                  className="w-full bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                />
              </div>

              <div className="space-y-8 relative">
                {ORDER_STEPS.map((step, idx) => {
                  const isCompleted = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  const Icon = step.icon;

                  return (
                    <div key={step.id} className={`flex gap-6 items-start transition-all duration-500 ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                      <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all border-4 ${
                        isCurrent 
                          ? 'bg-primary text-primary-foreground border-primary/20 scale-125 shadow-lg shadow-primary/20' 
                          : isCompleted 
                            ? 'bg-primary text-primary-foreground border-transparent' 
                            : 'bg-muted text-muted-foreground border-transparent'
                      }`}>
                        <Icon className="w-5 h-5" />
                        {isCurrent && (
                          <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-25"></span>
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className={`font-bold ${isCurrent ? 'text-primary text-lg' : 'text-foreground'}`}>
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="text-sm text-muted-foreground mt-1">Your order is currently at this stage.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Order Items */}
          <section className="bg-card border border-border rounded-3xl p-8 shadow-sm">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Package className="w-6 h-6 text-primary" /> Order Items
            </h3>
            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <div key={item._id} className="py-6 flex gap-6 items-center first:pt-0 last:pb-0">
                  <div className="w-20 h-20 bg-muted rounded-2xl overflow-hidden flex-shrink-0 border border-border shadow-sm">
                    {item.productSnapshot?.imageUrl ? (
                      <img src={item.productSnapshot.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Package className="w-8 h-8" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-lg truncate group-hover:text-primary transition-colors">{item.productSnapshot?.name || "Product"}</h4>
                    <p className="text-sm text-muted-foreground font-medium mt-1">Quantity: {item.quantity}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-lg font-black text-primary">{formatCurrency(item.totalPrice)}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border">₹{item.unitPrice} each</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Address & Payment */}
        <div className="space-y-8">
          
          {/* Summary Card */}
          <section className="bg-card border-2 border-primary/20 rounded-3xl p-8 shadow-xl shadow-primary/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <h3 className="text-xl font-black mb-6 relative z-10">Payment Summary</h3>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between text-muted-foreground font-medium">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground font-medium">
                <span>GST (Included)</span>
                <span>{formatCurrency(order.gstAmount)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600 font-bold bg-green-50 px-3 py-2 rounded-xl border border-green-100">
                  <span className="flex items-center gap-1.5 text-xs uppercase tracking-wider">Coupon Applied</span>
                  <span>−{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground font-medium">
                <span>Shipping</span>
                {order.shippingAmount === 0 ? (
                  <span className="text-green-500 font-black">FREE</span>
                ) : (
                  <span>{formatCurrency(order.shippingAmount)}</span>
                )}
              </div>
              <div className="pt-4 border-t-2 border-border border-dashed flex justify-between items-end">
                <div>
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Total Paid</p>
                  <p className="text-3xl font-black text-primary flex items-center"><IndianRupee className="w-5 h-5 -mr-1" />{order.totalAmount.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Shipping Address */}
          <section className="bg-card border border-border rounded-3xl p-8 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" /> Shipping Address
            </h3>
            <div className="text-sm font-medium space-y-1.5 text-muted-foreground">
              <p className="text-foreground font-black text-base">{order.addressSnapshot?.fullName}</p>
              <p>{order.addressSnapshot?.addressLine1}</p>
              {order.addressSnapshot?.addressLine2 && <p>{order.addressSnapshot?.addressLine2}</p>}
              <p>{order.addressSnapshot?.city}, {order.addressSnapshot?.state} {order.addressSnapshot?.pincode}</p>
              <div className="pt-3 flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Contact Phone</span>
                <p className="text-foreground">{order.addressSnapshot?.phone}</p>
              </div>
            </div>
          </section>

          {/* Cancellation */}
          {canCancel && !isCancelled && (
            <div className="bg-destructive/5 border-2 border-destructive/20 rounded-3xl p-6">
              {!showCancelForm ? (
                <div className="text-center">
                  <p className="text-xs font-bold text-destructive/80 mb-3 uppercase tracking-wider">Changed your mind?</p>
                  <button
                    onClick={() => setShowCancelForm(true)}
                    className="w-full py-3 px-4 bg-destructive text-destructive-foreground font-bold rounded-2xl hover:bg-destructive/90 transition-all shadow-lg shadow-destructive/10"
                  >
                    Cancel Order
                  </button>
                  <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">Orders can only be cancelled within 1 hour of placement.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-bold text-destructive flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Cancel Order?
                  </h4>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Reason for cancellation (optional)"
                    className="w-full p-4 bg-background border border-border rounded-2xl text-sm focus:ring-2 focus:ring-destructive/20 transition-all outline-none"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="flex-1 py-3 bg-destructive text-destructive-foreground font-bold rounded-xl text-sm disabled:opacity-50"
                    >
                      {cancelling ? '...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setShowCancelForm(false)}
                      className="flex-1 py-3 bg-muted font-bold rounded-xl text-sm"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

