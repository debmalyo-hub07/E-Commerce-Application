"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Star, 
  PackageSearch,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductImage {
  url: string;
  isPrimary: boolean;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  sellingPrice: number;
  stockQuantity: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  images: ProductImage[];
}

export default function AdminProducts() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  const limit = 10;

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

    const debounceTimer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(debounceTimer);
  }, [session, page, search]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

      setProducts(products.filter((p) => p._id !== id));
      setTotal(total - 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete product");
    }
  };

  const getPrimaryImage = (images: ProductImage[]) => {
    if (!images || images.length === 0) return null;
    return images.find(img => img.isPrimary)?.url || images[0].url;
  };

  if (!session) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto pb-10"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Products Catalog</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your inventory, pricing, and active listings.</p>
        </div>
        <Link href="/admin/products/new">
          <Button className="shadow-md rounded-xl hover:scale-105 transition-transform">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="bg-card border border-border rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, brand, or SKU..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
          />
        </div>
        <Button variant="outline" className="w-full sm:w-auto rounded-xl shadow-sm">
          <Filter className="w-4 h-4 mr-2" /> Filters
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-800 font-medium text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Data Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-muted-foreground font-medium text-sm">Loading catalog...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <PackageSearch className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">No products found</h3>
            <p className="text-muted-foreground mb-6 text-sm max-w-sm">
              {search ? "We couldn't find any products matching your search criteria." : "You haven't added any products to your catalog yet."}
            </p>
            {!search && (
              <Link href="/admin/products/new">
                <Button variant="default" className="rounded-xl shadow-md">Create your first product</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold text-foreground">Product</th>
                  <th className="px-6 py-4 font-semibold text-foreground">Price</th>
                  <th className="px-6 py-4 font-semibold text-foreground">Inventory</th>
                  <th className="px-6 py-4 font-semibold text-foreground">Status</th>
                  <th className="px-6 py-4 font-semibold text-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <AnimatePresence>
                  {products.map((product) => {
                    const primaryImage = getPrimaryImage(product.images);
                    return (
                      <motion.tr 
                        key={product._id} 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-muted/30 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg border border-border bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                              {primaryImage ? (
                                <img src={primaryImage} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <PackageSearch className="w-5 h-5 text-muted-foreground/50" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-foreground mb-0.5 max-w-[200px] truncate group-hover:text-primary transition-colors" title={product.name}>
                                {product.name}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                                  {product.slug.substring(0, 15)}...
                                </span>
                                {product.isFeatured && (
                                  <span className="flex items-center text-[10px] font-bold text-yellow-600 bg-yellow-100 px-1.5 py-0.5 rounded-full">
                                    <Star className="w-3 h-3 mr-0.5 fill-yellow-600" /> Featured
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 relative z-10">
                          <p className="font-bold text-foreground">₹{product.sellingPrice.toFixed(2)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            product.stockQuantity > 10 
                              ? "bg-green-50 text-green-700 border-green-200"
                              : product.stockQuantity > 0
                              ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              product.stockQuantity > 10 ? "bg-green-500" : product.stockQuantity > 0 ? "bg-yellow-500" : "bg-red-500"
                            }`}></span>
                            {product.stockQuantity} in stock
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            product.isActive
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-muted text-muted-foreground border-border"
                          }`}>
                            {product.isActive ? "Active" : "Draft"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/admin/products/${product._id}`}>
                              <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200">
                                <Edit3 className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => handleDelete(product._id, product.name)}
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
              Showing <span className="font-semibold text-foreground">{(page - 1) * limit + 1}</span> to <span className="font-semibold text-foreground">{Math.min(page * limit, total)}</span> of <span className="font-semibold text-foreground">{total}</span> products
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="rounded-lg shadow-sm"
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
                className="rounded-lg shadow-sm"
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
