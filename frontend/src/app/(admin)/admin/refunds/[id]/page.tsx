"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Refund {
  _id: string;
  orderNumber: string;
  totalAmount: number;
  paymentStatus: string;
  orderStatus: string;
  items: Array<{ productSnapshot: Record<string, unknown>; quantity: number; totalPrice: number }>;
  userId: { name: string; email: string };
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
        <p>Loading refund details...</p>
      </div>
    );
  }

  if (error || !refund) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Refund not found"}</p>
          <Link href="/admin/refunds" className="text-blue-600 hover:underline">
            Back to Refunds
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Refund Request: {refund.orderNumber}
                </h1>
                <p className="text-gray-600 mt-1">
                  Requested on {new Date(refund.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className="px-4 py-2 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
                {refund.paymentStatus}
              </span>
            </div>
          </div>

          <div className="px-6 py-4">
            <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
            <div className="bg-gray-50 p-4 rounded">
              <p className="font-medium">{refund.userId.name}</p>
              <p className="text-gray-600">{refund.userId.email}</p>
            </div>
          </div>

          <div className="px-6 py-4 border-t">
            <h2 className="text-xl font-semibold mb-4">Order Items</h2>
            <div className="space-y-3">
              {refund.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b">
                  <div className="flex-1">
                    <p className="font-medium">
                      {(item.productSnapshot as any)?.name || "Product"}
                    </p>
                    <p className="text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{item.totalPrice.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50">
            <div className="flex justify-between text-lg font-bold">
              <p>Refund Amount:</p>
              <p>₹{refund.totalAmount.toFixed(2)}</p>
            </div>
          </div>

          <div className="px-6 py-4 border-t">
            <h2 className="text-xl font-semibold mb-4">Decision</h2>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Note (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note for the customer..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleApprove}
                disabled={processing}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
              >
                {processing ? "Processing..." : "Approve Refund"}
              </button>
              <button
                onClick={handleReject}
                disabled={processing}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
              >
                {processing ? "Processing..." : "Reject Refund"}
              </button>
              <Link
                href="/admin/refunds"
                className="flex-1 px-6 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 text-center font-medium"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
    </div>
  );
}
