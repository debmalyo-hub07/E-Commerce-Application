"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PackageOpen, 
  Search, 
  Filter, 
  ChevronRight, 
  ChevronLeft, 
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Banknote,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Order {
  _id: string;
  orderNumber: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
  userId: { _id: string; name: string; email: string } | null;
}

export default function AdminOrders() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const limit = 15;

  useEffect(() => {
    if (!session) return;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const query = new URLSearchParams();
        query.set("page", page.toString());
        query.set("limit", limit.toString());
        if (statusFilter && statusFilter !== "ALL") query.set("status", statusFilter);

        const response = await fetch(`/api/admin/orders?${query}`);

        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }

        const data = await response.json();
        setOrders(data.data);
        setTotal(data.meta?.total || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [session, page, statusFilter]);

  if (!session) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200 shadow-sm"><Clock className="w-3 h-3" /> Pending</span>;
      case "CONFIRMED":
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"><CheckCircle2 className="w-3 h-3" /> Confirmed</span>;
      case "PROCESSING":
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm"><PackageOpen className="w-3 h-3" /> Processing</span>;
      case "SHIPPED":
      case "OUT_FOR_DELIVERY":
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 shadow-sm"><Truck className="w-3 h-3" /> {status === "SHIPPED" ? "Shipped" : "Out for Delivery"}</span>;
      case "DELIVERED":
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 shadow-sm"><CheckCircle2 className="w-3 h-3" /> Delivered</span>;
      case "CANCELLED":
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 shadow-sm"><XCircle className="w-3 h-3" /> Cancelled</span>;
      case "REFUNDED":
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 shadow-sm"><Banknote className="w-3 h-3" /> Refunded</span>;
      default:
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 shadow-sm">{status}</span>;
    }
  };

  const getPaymentBadge = (status: string) => {
    if (status === "PAID" || status === "COMPLETED") {
      return <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100">Paid</span>;
    }
    if (status === "FAILED") {
      return <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-100">Failed</span>;
    }
    if (status === "REFUNDED") {
      return <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-md border border-purple-100">Refunded</span>;
    }
    return <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md border border-yellow-100">{status || "Pending"}</span>;
  };

  const statusFilters = ["ALL", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto pb-10"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Orders Management</h1>
          <p className="text-muted-foreground mt-1 text-sm">Monitor and process customer orders in real-time.</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-card border border-border shadow-sm rounded-2xl p-2 flex overflow-x-auto hide-scrollbar gap-2">
        {statusFilters.map((status) => {
          const isSelected = (status === "ALL" && !statusFilter) || statusFilter === status;
          return (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status === "ALL" ? null : status);
                setPage(1);
              }}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                isSelected 
                  ? "bg-primary text-primary-foreground shadow-md scale-105" 
                  : "bg-transparent text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {status === "ALL" ? "All Orders" : status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ')}
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

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-muted-foreground font-medium text-sm">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <PackageOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No orders found</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              {statusFilter ? `There are no orders with status '${statusFilter}' at the moment.` : "You don't have any orders yet. Once customers purchase items, they will appear here."}
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
                  <th className="px-6 py-4 font-semibold text-gray-900">Order Status</th>
                  <th className="px-6 py-4 font-semibold text-gray-900">Payment</th>
                  <th className="px-6 py-4 font-semibold text-gray-900 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <AnimatePresence>
                  {orders.map((order) => (
                    <motion.tr 
                      key={order._id} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-muted/30 transition-colors group cursor-pointer"
                      onClick={() => window.location.href = `/admin/orders/${order._id}`}
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900 mb-0.5 font-mono group-hover:text-primary transition-colors">
                          #{order.orderNumber}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {order.userId?.name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 truncate max-w-[120px]">
                              {order.userId?.name ?? "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                              {order.userId?.email ?? ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(order.orderStatus)}
                      </td>
                      <td className="px-6 py-4">
                        {getPaymentBadge(order.paymentStatus)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/admin/orders/${order._id}`} onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" className="text-primary hover:bg-primary/10 rounded-xl px-4 shadow-sm group-hover:shadow-md border border-transparent group-hover:border-primary/20 transition-all">
                            Manage
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
              Showing <span className="font-semibold text-gray-900">{(page - 1) * limit + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(page * limit, total)}</span> of <span className="font-semibold text-gray-900">{total}</span> orders
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
