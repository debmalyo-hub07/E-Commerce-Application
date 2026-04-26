"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Banknote, 
  Search, 
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  UserCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Refund {
  _id: string;
  orderNumber: string;
  totalAmount: number;
  paymentStatus: string;
  orderStatus: string;
  userId: { name: string; email: string } | null;
  createdAt: string;
}

export default function AdminRefundsPage() {
  const { data: session } = useSession();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  const limit = 15;

  useEffect(() => {
    if (!session) return;

    const fetchRefunds = async () => {
      try {
        setLoading(true);
        const query = new URLSearchParams();
        query.set("page", page.toString());
        query.set("limit", limit.toString());
        if (search) query.set("search", search);

        const response = await fetch(`/api/admin/refunds?${query}`);

        if (!response.ok) {
          throw new Error("Failed to fetch refund requests");
        }

        const data = await response.json();
        setRefunds(data.data);
        setTotal(data.meta?.total || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load refunds");
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchRefunds, 300);
    return () => clearTimeout(debounceTimer);
  }, [session, page, search]);

  if (!session) return null;

  const getRefundBadge = (status: string) => {
    switch(status?.toUpperCase()) {
      case "REFUNDED":
      case "COMPLETED":
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 shadow-sm"><CheckCircle2 className="w-3 h-3" /> Refunded</span>;
      case "REJECTED":
      case "FAILED":
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 shadow-sm"><XCircle className="w-3 h-3" /> Rejected</span>;
      default:
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200 shadow-sm"><Clock className="w-3 h-3" /> Pending</span>;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto pb-10"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Refund Requests</h1>
          <p className="text-muted-foreground mt-1 text-sm">Review, approve, or reject customer refund requests.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by order number or customer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
          />
        </div>
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

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-muted-foreground font-medium text-sm">Loading refund requests...</p>
          </div>
        ) : refunds.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Banknote className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No refund requests</h3>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              {search ? "No requests match your search query." : "You're all caught up! There are no pending refund requests at the moment."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-900">Order ID & Date</th>
                  <th className="px-6 py-4 font-semibold text-gray-900">Customer</th>
                  <th className="px-6 py-4 font-semibold text-gray-900">Amount</th>
                  <th className="px-6 py-4 font-semibold text-gray-900">Refund Status</th>
                  <th className="px-6 py-4 font-semibold text-gray-900 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <AnimatePresence>
                  {refunds.map((refund) => (
                    <motion.tr 
                      key={refund._id} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-muted/30 transition-colors group cursor-pointer"
                      onClick={() => window.location.href = `/admin/refunds/${refund._id}`}
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900 mb-0.5 font-mono group-hover:text-primary transition-colors">
                          #{refund.orderNumber}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(refund.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-primary/20">
                            {refund.userId?.name ? refund.userId.name.charAt(0).toUpperCase() : <UserCircle className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm max-w-[150px] truncate">
                              {refund.userId?.name || "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground max-w-[150px] truncate">
                              {refund.userId?.email || "N/A"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900 text-base">₹{refund.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      </td>
                      <td className="px-6 py-4">
                        {getRefundBadge(refund.paymentStatus)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/admin/refunds/${refund._id}`} onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" className="text-primary hover:bg-primary/10 rounded-xl px-4 shadow-sm group-hover:shadow-md border border-transparent group-hover:border-primary/20 transition-all">
                            Review <ExternalLink className="w-3 h-3 ml-2" />
                          </Button>
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && total > 0 && Math.ceil(total / limit) > 1 && (
          <div className="px-6 py-4 border-t border-border bg-muted/20 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-semibold text-gray-900">{(page - 1) * limit + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(page * limit, total)}</span> of <span className="font-semibold text-gray-900">{total}</span> refunds
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
      </div>
    </motion.div>
  );
}
