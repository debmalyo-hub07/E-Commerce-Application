"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Star, 
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserCircle,
  Clock
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

export default function AdminReviewsPage() {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");

  const limit = 15;

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

    const debounceTimer = setTimeout(fetchReviews, 300);
    return () => clearTimeout(debounceTimer);
  }, [session, page, filter]);

  if (!session) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto pb-10"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Review Moderation</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage and moderate customer product reviews.</p>
        </div>
      </div>

      <div className="bg-card border border-border shadow-sm rounded-2xl p-2 flex overflow-x-auto hide-scrollbar gap-2">
        {(["pending", "approved", "all"] as const).map((status) => {
          const isSelected = filter === status;
          return (
            <button
              key={status}
              onClick={() => {
                setFilter(status);
                setPage(1);
              }}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                isSelected 
                  ? "bg-primary text-primary-foreground shadow-md scale-105" 
                  : "bg-transparent text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {status === "all" ? "All Reviews" : status === "pending" ? "Pending Approval" : "Approved"}
            </button>
          )
        })}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-800 font-medium text-sm flex items-center gap-2 shadow-sm"
          >
            <AlertCircle className="w-4 h-4" /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {loading ? (
          <div className="bg-card border border-border rounded-2xl shadow-sm p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-muted-foreground font-medium text-sm">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl shadow-sm p-16 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No reviews found</h3>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              There are no reviews matching your current filter criteria.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence>
                {reviews.map((review) => (
                  <motion.div
                    key={review._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-card rounded-2xl shadow-sm border border-border p-6 hover:shadow-md transition-all relative overflow-hidden flex flex-col"
                  >
                    {/* Status accent strip */}
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${review.isApproved ? "bg-green-500" : "bg-amber-500"}`} />

                    <div className="flex justify-between items-start mb-4 pl-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-1 mb-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`w-4 h-4 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"}`} 
                            />
                          ))}
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1">{review.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 font-medium text-gray-700">
                            <UserCircle className="w-3.5 h-3.5" /> {review.userId.name}
                          </span>
                          <span>•</span>
                          <span className="truncate max-w-[150px]">On: <span className="font-medium text-primary">{review.productId.name}</span></span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-2 shrink-0">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border shadow-sm flex items-center gap-1 ${
                            review.isApproved
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {review.isApproved ? <><CheckCircle2 className="w-3 h-3"/> Approved</> : <><Clock className="w-3 h-3"/> Pending</>}
                        </span>
                        {review.isVerifiedPurchase && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold uppercase tracking-wider rounded flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Verified
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm italic pl-3 mb-6 flex-1 bg-muted/30 p-3 rounded-xl border border-border/50">
                      "{review.body}"
                    </p>

                    <div className="flex justify-between items-center pl-3 mt-auto pt-4 border-t border-border/50">
                      <p className="text-muted-foreground text-xs font-medium">
                        {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                      <Link href={`/admin/reviews/${review._id}`}>
                        <Button variant="outline" size="sm" className="rounded-xl shadow-sm text-xs h-8 px-4 border-primary/20 text-primary hover:bg-primary/5">
                          Review Action
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {Math.ceil(total / limit) > 1 && (
              <div className="mt-8 bg-card px-6 py-4 border border-border rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-gray-900">{(page - 1) * limit + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(page * limit, total)}</span> of <span className="font-semibold text-gray-900">{total}</span> reviews
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="rounded-lg shadow-sm bg-background"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                  </Button>
                  <div className="text-sm font-semibold px-3 py-1 bg-background border border-border rounded-lg shadow-sm">
                    {page}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= Math.ceil(total / limit)}
                    className="rounded-lg shadow-sm bg-background"
                  >
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
