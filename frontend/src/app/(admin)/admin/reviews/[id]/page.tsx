"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Review {
  _id: string;
  rating: number;
  title: string;
  body: string;
  isApproved: boolean;
  isVerifiedPurchase: boolean;
  userId: { name: string; email: string };
  productId: { name: string; slug: string };
  createdAt: string;
}

export default function AdminReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!session || !params.id) return;

    const fetchReview = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/reviews/${params.id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch review");
        }

        const data = await response.json();
        setReview(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load review");
      } finally {
        setLoading(false);
      }
    };

    fetchReview();
  }, [session, params.id]);

  const handleApprove = async () => {
    try {
      setProcessing(true);
      const response = await fetch(`/api/admin/reviews/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: true, note }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to approve review");
      }

      alert("Review approved");
      router.push("/admin/reviews");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve review");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    try {
      setProcessing(true);
      const response = await fetch(`/api/admin/reviews/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: false, note }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to reject review");
      }

      alert("Review rejected");
      router.push("/admin/reviews");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject review");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      setProcessing(true);
      const response = await fetch(`/api/admin/reviews/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete review");
      }

      alert("Review deleted");
      router.push("/admin/reviews");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete review");
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
        <p>Loading review...</p>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Review not found"}</p>
          <Link href="/admin/reviews" className="text-blue-600 hover:underline">
            Back to Reviews
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
                <h1 className="text-3xl font-bold text-gray-900">{review.title}</h1>
                <div className="mt-2 space-y-1">
                  <p className="text-gray-600">
                    Rating: <span className="text-lg">{"⭐".repeat(review.rating)}</span> ({review.rating}/5)
                  </p>
                  <p className="text-gray-600">Author: {review.userId.name}</p>
                  <p className="text-gray-600">Product: {review.productId.name}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-col">
                {review.isVerifiedPurchase && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded text-center">
                    ✓ Verified Purchase
                  </span>
                )}
                <span
                  className={`px-3 py-1 text-sm rounded text-center ${
                    review.isApproved
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {review.isApproved ? "Approved" : "Pending"}
                </span>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold mb-4">Review Content</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{review.body}</p>
            <p className="text-gray-500 text-sm mt-4">
              Submitted on {new Date(review.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="px-6 py-4 border-t">
            <h2 className="text-xl font-semibold mb-4">Moderation</h2>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Moderation Note (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add internal notes for your decision..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleApprove}
                disabled={processing}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
              >
                {processing ? "Processing..." : "Approve Review"}
              </button>
              <button
                onClick={handleReject}
                disabled={processing}
                className="flex-1 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 font-medium"
              >
                {processing ? "Processing..." : "Reject Review"}
              </button>
              <button
                onClick={handleDelete}
                disabled={processing}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
              >
                {processing ? "Processing..." : "Delete Review"}
              </button>
              <Link
                href="/admin/reviews"
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
