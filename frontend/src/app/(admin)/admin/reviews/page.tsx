"use client";

import { useEffect, useState } from "react";
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

export default function AdminReviewsPage() {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");

  const limit = 20;

  useEffect(() => {
    if (!session) return;

    const fetchReviews = async () => {
      try {
        setLoading(true);
        const query = new URLSearchParams();
        query.set("page", page.toString());
        query.set("limit", limit.toString());
        if (filter === "pending") query.set("isApproved", "false");
        if (filter === "approved") query.set("isApproved", "true");

        const response = await fetch(`/api/admin/reviews?${query}`);

        if (!response.ok) {
          throw new Error("Failed to fetch reviews");
        }

        const data = await response.json();
        setReviews(data.data);
        setTotal(data.meta?.total || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load reviews");
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [session, page, filter]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to access admin panel.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Review Moderation</h1>

        <div className="mb-6 flex gap-4">
          <button
            onClick={() => {
              setFilter("pending");
              setPage(1);
            }}
            className={`px-4 py-2 rounded ${
              filter === "pending"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-800 border border-gray-300"
            }`}
          >
            Pending Approval
          </button>
          <button
            onClick={() => {
              setFilter("approved");
              setPage(1);
            }}
            className={`px-4 py-2 rounded ${
              filter === "approved"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-800 border border-gray-300"
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => {
              setFilter("all");
              setPage(1);
            }}
            className={`px-4 py-2 rounded ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-800 border border-gray-300"
            }`}
          >
            All Reviews
          </button>
        </div>

        {error && (
          <div className="bg-red-50 p-4 rounded-lg mb-6 text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p>Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">No reviews found.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review._id}
                  className="bg-white rounded-lg shadow p-6 border-l-4"
                  style={{
                    borderLeftColor: review.isApproved ? "#10b981" : "#f59e0b",
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{review.title}</h3>
                      <p className="text-gray-600 text-sm">
                        {review.userId.name} · Rated {review.rating}★
                      </p>
                      <p className="text-gray-500 text-xs">
                        on {review.productId.name}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {review.isVerifiedPurchase && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          ✓ Verified
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          review.isApproved
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {review.isApproved ? "Approved" : "Pending"}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4">{review.body}</p>

                  <div className="flex justify-between items-center">
                    <p className="text-gray-500 text-sm">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                    <Link
                      href={`/admin/reviews/${review._id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Review Action
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {Math.ceil(total / limit) > 1 && (
              <div className="mt-6 flex justify-between items-center">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {Math.ceil(total / limit)}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= Math.ceil(total / limit)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
