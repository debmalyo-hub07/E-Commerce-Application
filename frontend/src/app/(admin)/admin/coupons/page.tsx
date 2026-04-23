"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

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

  const limit = 20;

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

    fetchCoupons();
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

      alert("Coupon deleted successfully");
      setCoupons(coupons.filter((c) => c._id !== id));
      setTotal(total - 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete coupon");
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to access admin panel.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Coupons Management</h1>
          <Link
            href="/admin/coupons/new"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Create Coupon
          </Link>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search coupons by code..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <div className="bg-red-50 p-4 rounded-lg mb-6 text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p>Loading coupons...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">No coupons found.</p>
            <Link href="/admin/coupons/new" className="text-blue-600 hover:underline">
              Create your first coupon
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Type & Value
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Min Order
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Used / Limit
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Expires
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {coupons.map((coupon) => (
                      <tr key={coupon._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {coupon.code}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {coupon.type === "PERCENTAGE"
                            ? `${coupon.value}%`
                            : `₹${coupon.value}`}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {coupon.minOrderValue ? `₹${coupon.minOrderValue}` : "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {coupon.usedCount}
                          {coupon.usageLimit ? `/ ${coupon.usageLimit}` : "/ ∞"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              coupon.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {coupon.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {coupon.expiresAt
                            ? new Date(coupon.expiresAt).toLocaleDateString()
                            : "Never"}
                        </td>
                        <td className="px-6 py-4 text-sm space-x-2">
                          <Link
                            href={`/admin/coupons/${coupon._id}`}
                            className="text-blue-600 hover:underline"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(coupon._id, coupon.code)}
                            className="text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {Math.ceil(total / limit) > 1 && (
                <div className="px-6 py-4 border-t flex justify-between items-center">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {Math.ceil(total / limit)}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= Math.ceil(total / limit)}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
