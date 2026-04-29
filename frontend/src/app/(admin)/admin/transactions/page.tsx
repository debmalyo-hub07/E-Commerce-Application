"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  ChevronRight, 
  ChevronLeft, 
  CreditCard,
  User,
  ArrowUpRight,
  ExternalLink,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@nexmart/shared/utils";

interface Transaction {
  _id: string;
  orderId: { _id: string; orderNumber: string; orderStatus: string } | null;
  userId: { _id: string; name: string; email: string } | null;
  amount: number;
  currency: string;
  method: string;
  status: string;
  providerPaymentId: string;
  providerOrderId: string;
  createdAt: string;
}

export default function AdminTransactions() {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const limit = 15;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!session) return;

    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const query = new URLSearchParams();
        query.set("page", page.toString());
        query.set("limit", limit.toString());
        if (debouncedSearch) query.set("search", debouncedSearch);

        const response = await fetch(`/api/admin/transactions?${query}`);

        if (!response.ok) {
          throw new Error("Failed to fetch transactions");
        }

        const data = await response.json();
        setTransactions(data.data);
        setTotal(data.meta?.total || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load transactions");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [session, page, debouncedSearch]);

  if (!session) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
      case "COMPLETED":
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200"><CheckCircle2 className="w-3 h-3" /> Success</span>;
      case "FAILED":
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200"><XCircle className="w-3 h-3" /> Failed</span>;
      case "PENDING":
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200"><Clock className="w-3 h-3" /> Pending</span>;
      case "REFUNDED":
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200"><History className="w-3 h-3" /> Refunded</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{status}</span>;
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
          <h1 className="text-3xl font-black tracking-tight text-gray-900">Transaction Ledger</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Audit global payments and financial history.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search by Order # or User Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
          />
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 border border-red-100 p-4 rounded-2xl text-red-800 font-medium text-sm flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4" /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
        {loading && transactions.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-muted-foreground font-medium">Loading ledger...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <CreditCard className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No transactions found</h3>
            <p className="text-muted-foreground text-sm max-w-sm mt-1">
              Try adjusting your search filters or check back later.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-bold text-gray-900">Transaction ID</th>
                  <th className="px-6 py-4 font-bold text-gray-900">Order</th>
                  <th className="px-6 py-4 font-bold text-gray-900">Customer</th>
                  <th className="px-6 py-4 font-bold text-gray-900">Amount</th>
                  <th className="px-6 py-4 font-bold text-gray-900">Status</th>
                  <th className="px-6 py-4 font-bold text-gray-900 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((tx) => (
                  <motion.tr 
                    key={tx._id} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-muted/20 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <p className="font-mono text-xs text-muted-foreground mb-1">Provider ID:</p>
                      <p className="font-bold text-gray-900 select-all truncate max-w-[150px]">{tx.providerPaymentId || "N/A"}</p>
                    </td>
                    <td className="px-6 py-4">
                      {tx.orderId ? (
                        <Link href={`/admin/orders/${tx.orderId._id}`} className="inline-flex items-center gap-1.5 text-primary font-bold hover:underline">
                          #{tx.orderId.orderNumber} <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : (
                        <span className="text-muted-foreground italic">Deleted Order</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {tx.userId?.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate max-w-[120px]">{tx.userId?.name ?? "Unknown"}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[120px]">{tx.userId?.email ?? ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-gray-900">{formatCurrency(tx.amount)}</p>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">{tx.method}</p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(tx.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-medium text-gray-900">{new Date(tx.createdAt).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && total > 0 && Math.ceil(total / limit) > 1 && (
          <div className="px-6 py-4 border-t border-border bg-muted/10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground font-medium">
              Showing <span className="font-bold text-gray-900">{(page - 1) * limit + 1}</span> to <span className="font-bold text-gray-900">{Math.min(page * limit, total)}</span> of <span className="font-bold text-gray-900">{total}</span> entries
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="rounded-xl shadow-sm"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </Button>
              <div className="text-sm font-bold px-3 py-1 bg-background border border-border rounded-lg shadow-sm">
                {page}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= Math.ceil(total / limit)}
                className="rounded-xl shadow-sm"
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