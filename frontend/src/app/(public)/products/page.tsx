import { Metadata } from "next";
import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";
import Category from "@/models/Category";
import Review from "@/models/Review";
import { ProductCard } from "@/components/product/ProductCard";

export const metadata: Metadata = {
  title: "Products | StyleMart",
  description: "Browse our entire collection of premium products.",
};

export default async function ProductsPage(props: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  await connectDB();
  const searchParams = await props.searchParams;

  const filter: Record<string, unknown> = { isActive: true };

  if (searchParams.category) {
    const cat = await Category.findOne({ slug: searchParams.category }).select("_id").lean();
    if (cat) filter.categoryId = cat._id;
  }

  if (searchParams.search) {
    filter.name = { $regex: searchParams.search, $options: "i" };
  }

  const products = await Product.find(filter)
    .populate("categoryId", "name slug")
    .sort({ createdAt: -1 })
    .lean();

  const productIds = products.map((p) => p._id);
  const reviews = await Review.aggregate([
    { $match: { productId: { $in: productIds }, isApproved: true } },
    { $group: { _id: "$productId", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const reviewMap = new Map(reviews.map((r) => [r._id.toString(), r]));

  const formattedProducts = products.map((product) => {
    const reviewData = reviewMap.get(product._id.toString());
    const primaryImage = product.images?.find((img) => img.isPrimary) ?? product.images?.[0];
    const category = product.categoryId as unknown as { name: string; slug: string } | null;

    return {
      id: product._id.toString(),
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      sellingPrice: product.sellingPrice,
      discountPercent: product.discountPercent,
      gstPercent: product.gstPercent,
      imageUrl: primaryImage?.url || "",
      categoryName: category?.name ?? "",
      averageRating: reviewData ? Number(reviewData.avgRating.toFixed(1)) : 0,
      reviewsCount: reviewData?.count ?? 0,
      stockQuantity: product.stockQuantity,
      hasVariants: (product.variants?.length ?? 0) > 0,
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {searchParams.category ? `${searchParams.category} All Products` : "All Products"}
          {searchParams.search ? ` - Search results for "${searchParams.search}"` : ""}
        </h1>
        <p className="text-muted-foreground mt-2">
          {formattedProducts.length} product{formattedProducts.length !== 1 && "s"} found.
        </p>
      </div>

      {formattedProducts.length === 0 ? (
        <div className="text-center py-24 bg-muted/30 rounded-2xl border border-border">
          <h3 className="text-xl font-semibold mb-2">No products found</h3>
          <p className="text-muted-foreground">Try adjusting your category or search filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {formattedProducts.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      )}
    </div>
  );
}
