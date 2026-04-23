"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

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
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState("30");

  useEffect(() => {
    if (!session) return;

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

    fetchAnalytics();
  }, [session, range]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to access admin panel.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-50 p-4 rounded-lg mb-6 text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p>Loading analytics...</p>
          </div>
        ) : analytics ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm">Total Revenue</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  ₹{analytics.summary.totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm">Total Orders</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {analytics.summary.totalOrders}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm">New Customers</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {analytics.summary.totalCustomers}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Orders by Status</h2>
                <div className="space-y-3">
                  {analytics.ordersByStatus.map((status) => (
                    <div key={status._id} className="flex justify-between items-center">
                      <span className="text-gray-700">{status._id}</span>
                      <span className="font-semibold text-blue-600">{status.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Payment Status</h2>
                <div className="space-y-3">
                  {analytics.ordersByPaymentStatus.map((status) => (
                    <div key={status._id} className="flex justify-between items-center">
                      <span className="text-gray-700">{status._id}</span>
                      <span className="font-semibold text-green-600">{status.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Low Stock Alerts</h2>
                {analytics.lowStockProducts.length === 0 ? (
                  <p className="text-gray-600">All products well-stocked</p>
                ) : (
                  <div className="space-y-3">
                    {analytics.lowStockProducts.map((product) => (
                      <div
                        key={product._id}
                        className="flex justify-between items-center p-3 bg-yellow-50 rounded"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-600">Stock: {product.stockQuantity}</p>
                        </div>
                        <p className="text-sm font-semibold">₹{product.sellingPrice}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Top Selling Products</h2>
                <div className="space-y-3">
                  {analytics.topProducts.map((product, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-3 bg-blue-50 rounded"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{product.product.name}</p>
                        <p className="text-sm text-gray-600">Units: {product.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold">₹{product.revenue.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Order #</th>
                      <th className="text-left py-2 px-4">Customer</th>
                      <th className="text-left py-2 px-4">Amount</th>
                      <th className="text-left py-2 px-4">Status</th>
                      <th className="text-left py-2 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.recentOrders.map((order) => (
                      <tr key={order._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{order.orderNumber}</td>
                        <td className="py-3 px-4">{order.userId.name}</td>
                        <td className="py-3 px-4">₹{order.totalAmount.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {order.orderStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
