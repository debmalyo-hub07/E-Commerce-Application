"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

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
  createdAt: string;
  updatedAt: string;
}

export default function OrderDetail() {
  const params = useParams();
  const { data: session } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [showRefundForm, setShowRefundForm] = useState(false);

  useEffect(() => {
    if (!session || !params.id) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/user/orders/${params.id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch order");
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
  }, [session, params.id]);

  const canCancel = () => {
    if (!order) return false;

    const allowedStatuses = ["PENDING", "CONFIRMED"];
    if (!allowedStatuses.includes(order.orderStatus)) return false;

    const createdAtTime = new Date(order.createdAt).getTime();
    const nowTime = Date.now();
    const ageMs = nowTime - createdAtTime;
    const oneHourMs = 60 * 60 * 1000;

    return ageMs < oneHourMs;
  };

  const canRefund = () => {
    if (!order) return false;
    if (order.orderStatus !== "DELIVERED") return false;
    if (order.paymentStatus === "REFUND_INITIATED" || order.paymentStatus === "REFUNDED") return false;

    const updatedAtTime = new Date(order.updatedAt).getTime();
    const nowTime = Date.now();
    const ageMs = nowTime - updatedAtTime;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    return ageMs < sevenDaysMs;
  };

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

      alert("Order cancelled successfully. Stock has been restored.");
      setShowCancelForm(false);
      location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  const handleRefund = async () => {
    if (!refundReason.trim()) {
      alert("Please provide a reason for the refund");
      return;
    }

    try {
      setRefunding(true);
      const response = await fetch(`/api/user/orders/${params.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: refundReason }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to request refund");
      }

      alert("Refund request submitted. Admin will review and process your request.");
      setShowRefundForm(false);
      location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to request refund");
    } finally {
      setRefunding(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to view orders.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Order not found"}</p>
          <Link href="/account/orders" className="text-blue-600 hover:underline">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const statusColors = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    PROCESSING: "bg-blue-100 text-blue-800",
    SHIPPED: "bg-purple-100 text-purple-800",
    OUT_FOR_DELIVERY: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
    REFUNDED: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Order {order.orderNumber}
                </h1>
                <p className="text-gray-600 mt-1">
                  Placed on {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  statusColors[order.orderStatus as keyof typeof statusColors] || "bg-gray-100"
                }`}
              >
                {order.orderStatus}
              </span>
            </div>
          </div>

          <div className="px-6 py-4">
            <h2 className="text-xl font-semibold mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item._id} className="flex justify-between items-center py-2 border-b">
                  <div className="flex-1">
                    <p className="font-medium">
                      {(item.productSnapshot as any)?.name || "Product"}
                    </p>
                    <p className="text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{item.totalPrice.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">
                      ₹{item.unitPrice.toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 space-y-2">
            <div className="flex justify-between">
              <p>Subtotal:</p>
              <p>₹{order.subtotal.toFixed(2)}</p>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <p>Discount:</p>
                <p>-₹{order.discountAmount.toFixed(2)}</p>
              </div>
            )}
            <div className="flex justify-between">
              <p>GST:</p>
              <p>₹{order.gstAmount.toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
              <p>Shipping:</p>
              <p>₹{order.shippingAmount.toFixed(2)}</p>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <p>Total:</p>
              <p>₹{order.totalAmount.toFixed(2)}</p>
            </div>
          </div>

          <div className="px-6 py-4 border-t">
            <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
            <div className="text-gray-700">
              <p className="font-medium">{(order.addressSnapshot as any)?.fullName}</p>
              <p>{(order.addressSnapshot as any)?.addressLine1}</p>
              {(order.addressSnapshot as any)?.addressLine2 && (
                <p>{(order.addressSnapshot as any)?.addressLine2}</p>
              )}
              <p>
                {(order.addressSnapshot as any)?.city},{" "}
                {(order.addressSnapshot as any)?.state}{" "}
                {(order.addressSnapshot as any)?.pincode}
              </p>
              <p>Phone: {(order.addressSnapshot as any)?.phone}</p>
            </div>
          </div>

          <div className="px-6 py-4 border-t">
            <h2 className="text-xl font-semibold mb-4">Payment & Delivery</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 text-sm">Payment Method</p>
                <p className="font-medium">{order.paymentMethod}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Payment Status</p>
                <p className="font-medium">{order.paymentStatus}</p>
              </div>
              {order.trackingNumber && (
                <div>
                  <p className="text-gray-600 text-sm">Tracking Number</p>
                  <p className="font-medium">{order.trackingNumber}</p>
                </div>
              )}
            </div>
          </div>

          {canCancel() && (
            <div className="px-6 py-4 border-t bg-blue-50">
              {!showCancelForm ? (
                <button
                  onClick={() => setShowCancelForm(true)}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Cancel Order
                </button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Cancellation Reason (optional)
                    </label>
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Tell us why you're cancelling..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {cancelling ? "Cancelling..." : "Confirm Cancellation"}
                    </button>
                    <button
                      onClick={() => setShowCancelForm(false)}
                      disabled={cancelling}
                      className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {canRefund() && (
            <div className="px-6 py-4 border-t bg-green-50">
              {!showRefundForm ? (
                <button
                  onClick={() => setShowRefundForm(true)}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Request Refund
                </button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Refund Reason *
                    </label>
                    <textarea
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="Please tell us why you want a refund..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Refunds can only be requested within 7 days of delivery
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleRefund}
                      disabled={refunding || !refundReason.trim()}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {refunding ? "Submitting..." : "Submit Refund Request"}
                    </button>
                    <button
                      onClick={() => setShowRefundForm(false)}
                      disabled={refunding}
                      className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6">
          <Link href="/account/orders" className="text-blue-600 hover:underline">
            ← Back to Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
