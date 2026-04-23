"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Product {
  _id: string;
  name: string;
  slug: string;
  sellingPrice: number;
  stockQuantity: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
}

export default function AdminProducts() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  const limit = 20;

  useEffect(() => {
    if (!session) return;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const query = new URLSearchParams();
        query.set("page", page.toString());
        query.set("limit", limit.toString());
        if (search) query.set("search", search);

        const response = await fetch(`/api/admin/products?${query}`);

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();
        setProducts(data.data);
        setTotal(data.meta?.total || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [session, page, search]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

      alert("Product deleted successfully");
      setProducts(products.filter((p) => p._id !== id));
      setTotal(total - 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete product");
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
          <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>
          <Link
            href="/admin/products/new"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Add Product
          </Link>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search products..."
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
            <p>Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">No products found.</p>
            <Link href="/admin/products/new" className="text-blue-600 hover:underline">
              Create your first product
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
                        Product Name
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Featured
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {products.map((product) => (
                      <tr key={product._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          ₹{product.sellingPrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              product.stockQuantity > 0
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {product.stockQuantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              product.isActive
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {product.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {product.isFeatured ? (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                              ⭐ Featured
                            </span>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm space-x-2">
                          <Link
                            href={`/admin/products/${product._id}`}
                            className="text-blue-600 hover:underline"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(product._id, product.name)}
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
