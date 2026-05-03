"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Star,
  User,
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Review not found"}</p>
          <Link href="/admin/reviews" className="text-primary hover:underline">
            Back to Reviews
          </Link>
        </div>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-muted text-muted"
            }`}
          />
        ))}
      </div>
    );
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
            href="/admin/reviews"
            className="p-2 rounded-xl hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Review Details
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Review moderation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {review.isVerifiedPurchase && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <ShieldCheck className="w-4 h-4" /> Verified Purchase
            </span>
          )}
          <span
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              review.isApproved
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-yellow-50 text-yellow-700 border-yellow-200"
            }`}
          >
            {review.isApproved ? (
              <>
                <CheckCircle2 className="w-3 h-3" /> Approved
              </>
            ) : (
              <>
                <Clock className="w-3 h-3" /> Pending
              </>
            )}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
            <div className="px-6 py-5 border-b border-border bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
              <div className="flex items-start justify-between">
                <div>
                  {renderStars(review.rating)}
                  <h2 className="text-xl font-bold text-foreground mt-3">
                    {review.title}
                  </h2>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {review.rating}/5
                  </p>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-muted/30 rounded-xl p-4 mb-6 border border-border/50">
                <p className="text-foreground italic leading-relaxed whitespace-pre-wrap">
                  "{review.body}"
                </p>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Submitted on{" "}
                  {new Date(review.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Moderation
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Moderation Note (internal)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add internal notes for your decision..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-foreground resize-none"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleApprove}
                  disabled={processing || review.isApproved}
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
                      Approve
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={processing || !review.isApproved}
                  variant="outline"
                  className="flex-1 rounded-xl text-yellow-700 border-yellow-200 hover:bg-yellow-50"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={processing}
                  variant="destructive"
                  className="flex-1 rounded-xl"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Delete"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <User className="w-5 h-5" />
                Reviewer
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Name</p>
                <p className="font-semibold text-foreground">
                  {review.userId.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Email</p>
                <p className="font-semibold text-foreground">
                  {review.userId.email}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Package className="w-5 h-5" />
                Product
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Name</p>
                <p className="font-semibold text-foreground">
                  {review.productId.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Slug</p>
                <p className="font-mono text-sm text-foreground">
                  {review.productId.slug}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}