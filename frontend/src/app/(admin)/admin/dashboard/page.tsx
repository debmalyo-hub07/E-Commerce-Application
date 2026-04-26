"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import {
  TrendingUp,
  Users,
  ShoppingBag,
  IndianRupee,
  CheckCircle2,
  Clock,
  AlertCircle,
  Package,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Link from 'next/link';

interface Analytics {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
  };
  lowStockProducts: Array<{
    _id: string;
    name: string;
    stockQuantity: number;
    sellingPrice: number;
  }>;
  recentOrders: Array<{
    _id: string;
    orderNumber: string;
    totalAmount: number;
    orderStatus: string;
    userId: { name: string; email: string };
    createdAt: string;
  }>;
  topProducts: Array<{
    _id: string;
    product: { name: string; slug: string };
    quantity: number;
    revenue: number;
  }>;
  ordersByStatus: Array<{ _id: string; count: number }>;
  ordersByPaymentStatus: Array<{ _id: string; count: number }>;
  revenueTrend: Array<{ month: string; revenue: number }>;
}

const statusColorsMap: Record<string, string> = {
  DELIVERED: 'bg-green-100 text-green-800',
  SHIPPED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-amber-100 text-amber-800',
  PENDING: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-600',
};

const pieColors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState("30");

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?range=${range}`);
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }
      const data = await response.json();
      setAnalytics(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchAnalytics();
  }, [session, range]);

  if (!session) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <p>Please log in to access admin panel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening with your store today.</p>
        </div>
        <div className="flex gap-3 items-center">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="px-4 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary bg-card"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <Button variant="outline" onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/admin/products/new">
            <Button>
              <Package className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl mb-6 text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-card rounded-xl border shadow-sm p-12 text-center h-64 flex flex-col justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading premium analytics...</p>
        </div>
      ) : analytics ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div className="bg-card p-5 rounded-xl border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-100 text-green-600 p-2.5 rounded-xl">
                  <IndianRupee className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-2xl font-bold">₹{analytics.summary.totalRevenue.toLocaleString()}</h3>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
            
            <div className="bg-card p-5 rounded-xl border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-100 text-blue-600 p-2.5 rounded-xl">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-2xl font-bold">{analytics.summary.totalOrders}</h3>
              <p className="text-sm text-muted-foreground">Total Orders</p>
            </div>

            <div className="bg-card p-5 rounded-xl border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-purple-100 text-purple-600 p-2.5 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-2xl font-bold">{analytics.summary.totalCustomers}</h3>
              <p className="text-sm text-muted-foreground">New Customers</p>
            </div>

            <div className="bg-card p-5 rounded-xl border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-red-100 text-red-600 p-2.5 rounded-xl">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-2xl font-bold">{analytics.lowStockProducts.length}</h3>
              <p className="text-sm text-muted-foreground">Low Stock Alerts</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <div className="bg-card p-6 rounded-xl border shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
              <div className="h-80">
                {analytics.revenueTrend && analytics.revenueTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.revenueTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value) => [`₹${value}`, 'Revenue']} 
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">No revenue data for this period</div>
                )}
              </div>
            </div>

            {/* Order Status Distribution */}
            <div className="bg-card p-6 rounded-xl border shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Order Status Distribution</h3>
              <div className="h-80">
                {analytics.ordersByStatus && analytics.ordersByStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.ordersByStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="_id"
                      >
                        {analytics.ordersByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value) => [value, 'Orders']} 
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">No order data for this period</div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Selling Products */}
            <div className="bg-card p-6 rounded-xl border shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
              <div className="space-y-4">
                {analytics.topProducts && analytics.topProducts.length > 0 ? (
                  analytics.topProducts.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 hover:bg-accent rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm line-clamp-1">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">{item.quantity} units sold</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">₹{item.revenue.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground py-4 text-center">No sales data found</p>
                )}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-card p-6 rounded-xl border shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Recent Orders</h3>
                <Link href="/admin/orders">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 font-medium text-muted-foreground">Order ID</th>
                      <th className="text-left py-3 font-medium text-muted-foreground">Customer</th>
                      <th className="text-left py-3 font-medium text-muted-foreground">Amount</th>
                      <th className="text-left py-3 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.recentOrders && analytics.recentOrders.length > 0 ? (
                      analytics.recentOrders.map((order) => (
                        <tr key={order._id} className="border-b hover:bg-accent/50 transition-colors">
                          <td className="py-3 font-medium">
                            <Link href={`/admin/orders/${order._id}`} className="hover:text-primary hover:underline">
                              {order.orderNumber}
                            </Link>
                          </td>
                          <td className="py-3">{order.userId.name}</td>
                          <td className="py-3 font-bold">₹{order.totalAmount.toFixed(2)}</td>
                          <td className="py-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColorsMap[order.orderStatus] || 'bg-gray-100'}`}>
                              {order.orderStatus}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-muted-foreground">No recent orders found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
