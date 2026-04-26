"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Ticket, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Percent,
  Banknote,
  Calendar,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Infinity as InfinityIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Coupon {
  _id: string;
  code: string;
  type: "PERCENTAGE" | "FLAT";
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

export default function AdminCouponsPage() {
  const { data: session } = useSession();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  const limit = 15;

  useEffect(() => {
    if (!session) return;

    const fetchCoupons = async () => {
      try {
        setLoading(true);
        const query = new URLSearchParams();
        query.set("page", page.toString());
        query.set("limit", limit.toString());
        if (search) query.set("search", search);

        const response = await fetch(`/api/admin/coupons?${query}`);

        if (!response.ok) {
          throw new Error("Failed to fetch coupons");
        }

        const data = await response.json();
        setCoupons(data.data);
        setTotal(data.meta?.total || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load coupons");
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchCoupons, 300);
    return () => clearTimeout(debounceTimer);
  }, [session, page, search]);

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete coupon "${code}"?`)) return;

    try {
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete coupon");
      }

      setCoupons(coupons.filter((c) => c._id !== id));
      setTotal(total - 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete coupon");
    }
  };

  if (!session) return null;

  const isExpired = (dateString?: string) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto pb-10"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Discount Coupons</h1>
          <p className="text-muted-foreground mt-1 text-sm">Create and manage promotional discount codes.</p>
        </div>
        <Link href="/admin/coupons/new">
          <Button className="shadow-md rounded-xl hover:scale-105 transition-transform">
            <Plus className="w-4 h-4 mr-2" />
            Create Coupon
          </Button>
        </Link>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search coupons by code..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm uppercase"
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
            <p className="text-muted-foreground font-medium text-sm">Loading coupons...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Ticket className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No coupons found</h3>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              {search ? "No coupons match your search query." : "You haven't created any discount coupons yet."}
            </p>
            {!search && (
              <Link href="/admin/coupons/new">
                <Button variant="default" className="rounded-xl shadow-md">Create your first coupon</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-900">Coupon Code</th>
                  <th className="px-6 py-4 font-semibold text-gray-900">Discount</th>
                  <th className="px-6 py-4 font-semibold text-gray-900">Usage & Limits</th>
                  <th className="px-6 py-4 font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 font-semibold text-gray-900 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <AnimatePresence>
                  {coupons.map((coupon) => {
                    const expired = isExpired(coupon.expiresAt);
                    return (
                      <motion.tr 
                        key={coupon._id} 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-muted/30 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                              expired || (!coupon.isActive) ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary border border-primary/20"
                            }`}>
                              <Ticket className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold font-mono tracking-wider text-gray-900 text-base">
                                {coupon.code}
                              </p>
                              {coupon.minOrderValue && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Min order: ₹{coupon.minOrderValue}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 font-bold text-gray-900 text-lg">
                            {coupon.type === "PERCENTAGE" ? (
                              <span className="flex items-center text-blue-600"><Percent className="w-4 h-4 mr-0.5" />{coupon.value}</span>
                            ) : (
                              <span className="flex items-center text-green-600"><Banknote className="w-4 h-4 mr-0.5" />₹{coupon.value}</span>
                            )}
                          </div>
                          {coupon.maxDiscount && coupon.type === "PERCENTAGE" && (
                            <p className="text-xs text-muted-foreground mt-0.5">Up to ₹{coupon.maxDiscount}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <span className="font-semibold text-gray-900">{coupon.usedCount}</span> used
                              <span className="text-muted-foreground">/</span>
                              {coupon.usageLimit ? (
                                <span className="font-semibold text-gray-900">{coupon.usageLimit}</span>
                              ) : (
                                <InfinityIcon className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                            {coupon.usageLimit && coupon.usedCount >= coupon.usageLimit && (
                              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100 w-max">LIMIT REACHED</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2 items-start">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              expired ? "bg-red-50 text-red-700 border-red-200"
                              : coupon.isActive ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-muted text-muted-foreground border-border"
                            }`}>
                              {expired ? "Expired" : coupon.isActive ? "Active" : "Inactive"}
                            </span>
                            {coupon.expiresAt && !expired && (
                              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                                <Calendar className="w-3 h-3" /> Ends {new Date(coupon.expiresAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/admin/coupons/${coupon._id}`}>
                              <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200">
                                <Edit3 className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => handleDelete(coupon._id, coupon.code)}
                              className="w-8 h-8 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && total > 0 && Math.ceil(total / limit) > 1 && (
          <div className="px-6 py-4 border-t border-border bg-muted/20 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-semibold text-gray-900">{(page - 1) * limit + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(page * limit, total)}</span> of <span className="font-semibold text-gray-900">{total}</span> coupons
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
