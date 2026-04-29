"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Package, Truck, CheckCircle2, Clock, XCircle, AlertCircle, 
  ChevronLeft, CreditCard, MapPin, Calendar, Receipt, Edit3, 
  Save, StickyNote 
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderItem {
  _id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  gstPercent: number;
  totalPrice: number;
  productSnapshot: Record<string, unknown>;
}

interface Order {
  _id: string;
  orderNumber: string;
  userId: string;
  addressId: string;
  addressSnapshot: Record<string, unknown>;
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
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
  PROCESSING: "bg-indigo-100 text-indigo-800 border-indigo-200",
  SHIPPED: "bg-purple-100 text-purple-800 border-purple-200",
  OUT_FOR_DELIVERY: "bg-purple-100 text-purple-800 border-purple-200",
  DELIVERED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
  REFUNDED: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function AdminOrderDetail() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  useEffect(() => {
    if (!session || !params.id) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/orders/${params.id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch order");
        }

        const data = await response.json();
        setOrder(data.data);
        setNewStatus(data.data.orderStatus);
        setTrackingNumber(data.data.trackingNumber || "");
        setNotes(data.data.notes || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [session, params.id]);

  const handleUpdateStatus = async () => {
    if (!order || !newStatus || (newStatus === order.orderStatus && !isEditingNotes && trackingNumber === order.trackingNumber)) {
      alert("No changes to update.");
      return;
    }

    if (newStatus === "SHIPPED" && !trackingNumber.trim()) {
      alert("Tracking number is required for SHIPPED status");
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/orders/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderStatus: newStatus,
          trackingNumber: trackingNumber || undefined,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to update order");
      }

      const updated = await response.json();
      setOrder(updated.data);
      setNewStatus(updated.data.orderStatus);
      setTrackingNumber(updated.data.trackingNumber || "");
      setNotes(updated.data.notes || "");
      setIsEditingNotes(false);
      alert(`Order updated successfully!`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setUpdating(false);
    }
  };

  if (!session) return null;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground animate-pulse font-medium">Loading order details...</p>
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
          <p className="text-muted-foreground mb-8">{error || "We couldn't find the order."}</p>
          <Link href="/admin/orders" className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25">
            <ChevronLeft className="w-5 h-5" /> Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const allowedNextStatuses = ALLOWED_TRANSITIONS[order.orderStatus] || [];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-20 space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors mb-4 group">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Orders
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
              Order <span className="text-primary font-mono select-all">#{order.orderNumber}</span>
            </h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[order.orderStatus as keyof typeof statusColors] || "bg-gray-100 border-gray-200"}`}>
              {order.orderStatus}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-muted-foreground text-sm font-medium">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Updates & Items */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Status Update Card */}
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-primary" /> Update Order Status
            </h2>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">Change Status</label>
                  <select
                    value={newStatus || ""}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full h-11 px-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium outline-none"
                  >
                    <option value={order.orderStatus}>{order.orderStatus} (Current)</option>
                    {allowedNextStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  {allowedNextStatuses.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">No further transitions allowed.</p>
                  )}
                </div>

                {newStatus === "SHIPPED" && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground">Tracking Number <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="e.g. AWB123456789"
                      className="w-full h-11 px-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground flex justify-between items-center">
                  <span>Internal Notes</span>
                  {!isEditingNotes && (
                    <button onClick={() => setIsEditingNotes(true)} className="text-primary text-xs hover:underline">Edit Notes</button>
                  )}
                </label>
                {isEditingNotes ? (
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add private notes (customer won't see this)..."
                    rows={3}
                    className="w-full p-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium outline-none resize-none"
                  />
                ) : (
                  <div className="p-4 bg-muted/30 rounded-xl text-sm text-muted-foreground min-h-[3rem] border border-transparent">
                    {notes || "No internal notes added yet."}
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  onClick={handleUpdateStatus}
                  disabled={updating || (!isEditingNotes && newStatus === order.orderStatus && trackingNumber === order.trackingNumber)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 rounded-xl shadow-lg hover:shadow-primary/25 transition-all font-bold"
                >
                  {updating ? "Saving..." : "Save Changes"} <Save className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>

          {/* Items Card */}
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" /> Order Items ({order.items.reduce((acc, item) => acc + item.quantity, 0)})
            </h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item._id} className="flex gap-4 p-4 rounded-2xl border border-border/50 bg-muted/10 hover:bg-muted/30 transition-colors">
                  <div className="w-16 h-16 rounded-xl bg-background border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                    <Package className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="font-bold text-foreground text-sm line-clamp-2">
                      {(item.productSnapshot as any)?.name || "Product"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Qty: <span className="font-semibold text-foreground">{item.quantity}</span> × ₹{item.unitPrice.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="text-right flex flex-col justify-center">
                    <p className="font-black text-foreground">₹{item.totalPrice.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Incl. {item.gstPercent}% GST</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Customer & Payment */}
        <div className="space-y-8">
          
          {/* Customer & Address */}
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" /> Delivery Details
            </h2>
            <div className="p-4 bg-muted/20 rounded-2xl border border-border/50 space-y-3">
              <p className="font-bold text-foreground">{(order.addressSnapshot as any)?.fullName}</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>{(order.addressSnapshot as any)?.addressLine1}</p>
                {(order.addressSnapshot as any)?.addressLine2 && <p>{(order.addressSnapshot as any)?.addressLine2}</p>}
                <p>{(order.addressSnapshot as any)?.city}, {(order.addressSnapshot as any)?.state} {(order.addressSnapshot as any)?.pincode}</p>
              </div>
              <div className="pt-3 mt-3 border-t border-border/50">
                <p className="text-sm font-semibold text-foreground">Phone: <span className="font-normal text-muted-foreground">{(order.addressSnapshot as any)?.phone}</span></p>
              </div>
            </div>
          </div>

          {/* Payment & Summary */}
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" /> Payment Summary
            </h2>
            
            <div className="flex items-center justify-between p-4 mb-6 bg-muted/20 rounded-2xl border border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">{order.paymentMethod}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{order.paymentStatus}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-medium text-foreground">₹{order.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between items-center text-emerald-600">
                  <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
                  <span className="font-bold">-₹{order.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Shipping</span>
                <span className="font-medium text-foreground">{order.shippingAmount === 0 ? "Free" : `₹${order.shippingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>GST (Included)</span>
                <span className="font-medium text-foreground">₹{order.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              
              <div className="pt-4 mt-4 border-t border-border flex justify-between items-center">
                <span className="text-base font-bold text-foreground">Total Paid</span>
                <span className="text-2xl font-black text-primary tracking-tight">₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </motion.div>
  );
}
