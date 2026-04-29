"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/product/ProductCard";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchResultsClient() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const router = useRouter();
  const [input, setInput] = useState(q);

  const { data, isLoading } = useQuery({
    queryKey: ["search", q],
    queryFn: async () => {
      if (!q) return { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
      const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&limit=20`);
      return res.json();
    },
    enabled: !!q,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      router.push(`/search?q=${encodeURIComponent(input.trim())}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search for products, brands, categories..."
            className="w-full pl-12 pr-4 py-3.5 border border-border rounded-2xl bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>
      </form>

      {/* Results */}
      {!q && (
        <div className="text-center py-16">
          <SearchIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Search NexMart</h2>
          <p className="text-muted-foreground">Type a query to find products, brands, or categories.</p>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {q && data && data.data?.length === 0 && (
        <div className="text-center py-16">
          <h2 className="text-xl font-bold mb-2">No results for &ldquo;{q}&rdquo;</h2>
          <p className="text-muted-foreground">Try different keywords or browse our categories.</p>
        </div>
      )}

      {q && data && data.data?.length > 0 && (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold">
              Results for &ldquo;{q}&rdquo;
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {data.meta?.total ?? 0} products found
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {data.data.map((product: any, index: number) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                slug={product.slug}
                brand={product.brand}
                imageUrl={product.images?.[0]?.url ?? product.image_url}
                sellingPrice={Number(product.selling_price)}
                gstPercent={Number(product.gst_percent)}
                discountPercent={Number(product.discount_percent)}
                stockQuantity={product.stock_quantity}
                categoryName={product.category?.name}
                averageRating={product.average_rating ?? 0}
                reviewsCount={product.reviews_count ?? 0}
                index={index}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
