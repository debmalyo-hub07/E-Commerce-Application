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

export default function AdminOrderDetail() {
  const params = useParams();
  const { data: session } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [notes, setNotes] = useState("");

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
    if (!order || !newStatus || newStatus === order.orderStatus) {
      alert("No status change or invalid status selected");
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

      alert(`Order status updated to ${newStatus} successfully!`);
      location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setUpdating(false);
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
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Order not found"}</p>
          <Link href="/admin/orders" className="text-blue-600 hover:underline">
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

  const allowedNextStatuses = ALLOWED_TRANSITIONS[order.orderStatus] || [];

  return (
    <div className="space-y-6">
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

          <div className="px-6 py-4 bg-blue-50 border-b">
            <h2 className="text-xl font-semibold mb-4">Update Order Status</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  New Status
                </label>
                <select
                  value={newStatus || ""}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value={order.orderStatus}>{order.orderStatus} (current)</option>
                  {allowedNextStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                {allowedNextStatuses.length === 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    No valid transitions available for {order.orderStatus} status
                  </p>
                )}
              </div>

              {newStatus === "SHIPPED" && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tracking Number <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  Internal Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add internal notes about this order..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleUpdateStatus}
                disabled={updating || !allowedNextStatuses.includes(newStatus || "")}
                className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? "Updating..." : "Update Status"}
              </button>
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
            <h2 className="text-xl font-semibold mb-4">Payment & Delivery Info</h2>
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
              {order.couponCode && (
                <div>
                  <p className="text-gray-600 text-sm">Coupon Code</p>
                  <p className="font-medium">{order.couponCode}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Link href="/admin/orders" className="text-blue-600 hover:underline">
            ← Back to Orders
          </Link>
        </div>
    </div>
  );
}
