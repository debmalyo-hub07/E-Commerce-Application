"use client";

import React from 'react';
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

const stats = [
  { label: 'Total Revenue', value: '₹12,85,400', change: '+12.5%', icon: IndianRupee, color: 'text-green-600', bg: 'bg-green-100' },
  { label: 'Active Orders', value: '1,240', change: '+8.2%', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' },
  { label: 'New Customers', value: '450', change: '+15.1%', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
  { label: 'Conversion Rate', value: '3.24%', change: '-0.4%', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-100' },
  { label: 'Pending Orders', value: '89', change: '+2.1%', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
  { label: 'Low Stock Alerts', value: '12', change: '-3', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
];

const revenueData = [
  { month: 'Jan', revenue: 4000 },
  { month: 'Feb', revenue: 3000 },
  { month: 'Mar', revenue: 5000 },
  { month: 'Apr', revenue: 8000 },
  { month: 'May', revenue: 7500 },
  { month: 'Jun', revenue: 12000 },
];

const topProducts = [
  { name: 'Wireless Earbuds', sales: 1234, revenue: 123400 },
  { name: 'Smart Watch', sales: 987, revenue: 98700 },
  { name: 'Laptop Backpack', sales: 765, revenue: 76500 },
  { name: 'USB-C Hub', sales: 654, revenue: 65400 },
  { name: 'Desk Lamp', sales: 543, revenue: 54300 },
];

const orderStatusData = [
  { name: 'Delivered', value: 400, color: '#10b981' },
  { name: 'Processing', value: 300, color: '#3b82f6' },
  { name: 'Shipped', value: 200, color: '#8b5cf6' },
  { name: 'Pending', value: 100, color: '#f59e0b' },
  { name: 'Cancelled', value: 50, color: '#ef4444' },
];

const recentOrders = [
  { id: '#ORD-7842', customer: 'Aarav Sharma', amount: '₹4,299', status: 'Delivered', date: '20 Apr 2026' },
  { id: '#ORD-7841', customer: 'Priya Patel', amount: '₹8,999', status: 'Shipped', date: '19 Apr 2026' },
  { id: '#ORD-7840', customer: 'Rohan Verma', amount: '₹2,499', status: 'Processing', date: '19 Apr 2026' },
  { id: '#ORD-7839', customer: 'Neha Gupta', amount: '₹12,499', status: 'Pending', date: '18 Apr 2026' },
  { id: '#ORD-7838', customer: 'Karan Singh', amount: '₹6,799', status: 'Delivered', date: '18 Apr 2026' },
];

const statusColors: Record<string, string> = {
  Delivered: 'bg-green-100 text-green-800',
  Shipped: 'bg-blue-100 text-blue-800',
  Processing: 'bg-amber-100 text-amber-800',
  Pending: 'bg-gray-100 text-gray-800',
  Cancelled: 'bg-red-100 text-red-800',
};

export default function AdminOverview() {
  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening with your store today.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Package className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card p-5 rounded-xl border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} ${stat.color} p-2.5 rounded-xl`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-bold ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold">{stat.value}</h3>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-card p-6 rounded-xl border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-card p-6 rounded-xl border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Order Status Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Orders']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-card p-6 rounded-xl border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
          <div className="space-y-4">
            {topProducts.map((product, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 hover:bg-accent rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.sales} units sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">₹{product.revenue.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-card p-6 rounded-xl border shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Recent Orders</h3>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 text-sm font-medium text-muted-foreground">Order ID</th>
                  <th className="text-left py-3 text-sm font-medium text-muted-foreground">Customer</th>
                  <th className="text-left py-3 text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="text-left py-3 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 text-sm font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-accent/50">
                    <td className="py-3 font-medium">{order.id}</td>
                    <td className="py-3">{order.customer}</td>
                    <td className="py-3 font-bold">{order.amount}</td>
                    <td className="py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground">{order.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
