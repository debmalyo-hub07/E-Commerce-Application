import { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import User from "@/models/User";
import Product from "@/models/Product";
import { redirect } from "next/navigation";
import {
  ShoppingBag, Users, TrendingUp, Package, AlertTriangle,
  Clock, CheckCircle, Truck, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: { index: false },
};

async function getDashboardData() {
  await connectDB();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalOrders,
    pendingOrders,
    processingOrders,
    todayRevenue,
    weekRevenue,
    monthRevenue,
    activeCustomers,
    lowStockCount,
    recentOrders,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ orderStatus: "PENDING" }),
    Order.countDocuments({ orderStatus: { $in: ["CONFIRMED", "PROCESSING", "SHIPPED"] } }),
    Order.aggregate([
      { $match: { paymentStatus: "PAYMENT_VERIFIED", createdAt: { $gte: todayStart } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: "PAYMENT_VERIFIED", createdAt: { $gte: weekStart } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: "PAYMENT_VERIFIED", createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    User.countDocuments({ status: "ACTIVE", role: "CUSTOMER" }),
    Product.countDocuments({ stockQuantity: { $lte: 10 }, isActive: true }),
    Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("userId", "name email")
      .lean(),
  ]);

  return {
    totalOrders,
    pendingOrders,
    processingOrders,
    revenue: {
      today: todayRevenue[0]?.total ?? 0,
      week: weekRevenue[0]?.total ?? 0,
      month: monthRevenue[0]?.total ?? 0,
    },
    activeCustomers,
    lowStockCount,
    recentOrders,
  };
}

const statusColors: Record<string, string> = {
  PENDING: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950 border-yellow-200",
  CONFIRMED: "text-blue-600 bg-blue-50 dark:bg-blue-950 border-blue-200",
  PROCESSING: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950 border-indigo-200",
  SHIPPED: "text-purple-600 bg-purple-50 dark:bg-purple-950 border-purple-200",
  DELIVERED: "text-green-600 bg-green-50 dark:bg-green-950 border-green-200",
  CANCELLED: "text-red-600 bg-red-50 dark:bg-red-950 border-red-200",
  REFUNDED: "text-gray-600 bg-gray-50 dark:bg-gray-950 border-gray-200",
};

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/");
  }

  const data = await getDashboardData();

  const kpiCards = [
    {
      title: "Today's Revenue",
      value: formatCurrency(data.revenue.today),
      sub: `${((data.revenue.today / Math.max(data.revenue.week, 1)) * 100).toFixed(0)}% of this week`,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950",
      trend: "up",
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(data.revenue.month),
      sub: `Weekly: ${formatCurrency(data.revenue.week)}`,
      icon: ShoppingBag,
      color: "text-primary",
      bg: "bg-primary/5",
      trend: "up",
    },
    {
      title: "Total Orders",
      value: data.totalOrders.toLocaleString(),
      sub: `${data.pendingOrders} pending · ${data.processingOrders} active`,
      icon: Package,
      color: "text-indigo-600",
      bg: "bg-indigo-50 dark:bg-indigo-950",
      trend: "neutral",
    },
    {
      title: "Active Customers",
      value: data.activeCustomers.toLocaleString(),
      sub: "Verified accounts",
      icon: Users,
      color: "text-sky-600",
      bg: "bg-sky-50 dark:bg-sky-950",
      trend: "up",
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {session.user.name}. Here's what's happening today.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/products/new" className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors">
            + Add Product
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map(({ title, value, sub, icon: Icon, color, bg, trend }) => (
          <div key={title} className="p-5 bg-card border border-border rounded-2xl hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              {trend === "up" ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              ) : trend === "down" ? (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              ) : null}
            </div>
            <p className="text-2xl font-bold mb-1">{value}</p>
            <p className="text-sm font-medium text-foreground mb-0.5">{title}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      {/* Alerts Row */}
      {(data.pendingOrders > 0 || data.lowStockCount > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.pendingOrders > 0 && (
            <Link href="/admin/orders?status=PENDING" className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-2xl hover:shadow-md transition-all">
              <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                  {data.pendingOrders} Pending Order{data.pendingOrders !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  Click to review and confirm
                </p>
              </div>
            </Link>
          )}
          {data.lowStockCount > 0 && (
            <Link href="/admin/products?filter=low_stock" className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-2xl hover:shadow-md transition-all">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-800 dark:text-red-200">
                  {data.lowStockCount} Low Stock Product{data.lowStockCount !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  Stock &le; 10 units — restock required
                </p>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Recent Orders Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Order #", "Customer", "Items", "Amount", "Status", "Date", "Action"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No orders yet. Seed the database to see sample data.
                  </td>
                </tr>
              ) : data.recentOrders.map((order) => {
                const user = order.userId as unknown as { name: string; email: string };
                return (
                  <tr key={order._id.toString()} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-semibold">{order.orderNumber}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{order.items?.length ?? 0} items</td>
                    <td className="px-4 py-3 font-semibold">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-[11px] font-bold rounded-full border ${statusColors[order.orderStatus] ?? "text-gray-600 bg-gray-50 border-gray-200"}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order._id.toString()}`} className="text-xs text-primary hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { href: "/admin/products", icon: Package, label: "Products" },
          { href: "/admin/orders", icon: ShoppingBag, label: "Orders" },
          { href: "/admin/users", icon: Users, label: "Customers" },
          { href: "/admin/coupons", icon: TrendingUp, label: "Coupons" },
        ].map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className="flex flex-col items-center gap-2 p-4 bg-card border border-border rounded-2xl hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <Icon className="w-6 h-6 text-primary" />
            <span className="text-sm font-semibold">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
