"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Save, 
  ArrowLeft, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Tag, 
  Package, 
  Percent,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface ProductImage {
  url: string;
  publicId: string;
  isPrimary: boolean;
  displayOrder: number;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  brand?: string;
  categoryId: string;
  basePrice: number;
  sellingPrice: number;
  gstPercent: number;
  discountPercent: number;
  stockQuantity: number;
  isActive: boolean;
  isFeatured: boolean;
  images: ProductImage[];
}

export default function ProductForm() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const isNew = params.id === "new";

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Product>({
    _id: "",
    name: "",
    slug: "",
    description: "",
    brand: "",
    categoryId: "",
    basePrice: 0,
    sellingPrice: 0,
    gstPercent: 18,
    discountPercent: 0,
    stockQuantity: 0,
    isActive: true,
    isFeatured: false,
    images: [],
  });

  const [newImageUrl, setNewImageUrl] = useState("");

  useEffect(() => {
    if (!session) return;

    const fetchData = async () => {
      try {
        const catResponse = await fetch("/api/categories");
        if (catResponse.ok) {
          const data = await catResponse.json();
          setCategories(data.data || []);
        }

        if (!isNew && params.id) {
          const prodResponse = await fetch(`/api/admin/products/${params.id}`);
          if (!prodResponse.ok) throw new Error("Failed to fetch product");
          const data = await prodResponse.json();
          
          setFormData({
            ...data.data,
            categoryId: data.data.categoryId?._id || data.data.categoryId || "",
            images: data.data.images || []
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session, isNew, params.id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const finalValue =
      type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : type === "number"
        ? parseFloat(value) || 0
        : value;
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const generateSlug = () => {
    const slug = formData.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setFormData((prev) => ({ ...prev, slug }));
  };

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    try {
      new URL(newImageUrl); // Validate URL
      setFormData(prev => ({
        ...prev,
        images: [
          ...prev.images,
          {
            url: newImageUrl,
            publicId: `img_${Date.now()}`,
            isPrimary: prev.images.length === 0,
            displayOrder: prev.images.length
          }
        ]
      }));
      setNewImageUrl("");
    } catch {
      setError("Please enter a valid image URL (e.g. https://...)");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: form
      });
      
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Upload failed");
      
      setFormData(prev => ({
        ...prev,
        images: [
          ...prev.images,
          {
            url: data.data.url,
            publicId: data.data.publicId,
            isPrimary: prev.images.length === 0,
            displayOrder: prev.images.length
          }
        ]
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
      setTimeout(() => setError(null), 3000);
    } finally {
      setUploadingImage(false);
      // Reset input
      e.target.value = "";
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setFormData(prev => {
      const newImages = prev.images.filter((_, i) => i !== indexToRemove);
      if (newImages.length > 0 && prev.images[indexToRemove].isPrimary) {
        newImages[0].isPrimary = true;
      }
      return { ...prev, images: newImages };
    });
  };

  const handleSetPrimaryImage = (indexToSet: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => ({
        ...img,
        isPrimary: i === indexToSet
      }))
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (!formData.name.trim()) throw new Error("Product name is required");
      if (!formData.slug.trim()) throw new Error("Product slug is required");
      if (!formData.categoryId) throw new Error("Category is required");
      if (formData.sellingPrice <= 0) throw new Error("Selling price must be positive");

      const method = isNew ? "POST" : "PUT";
      const url = isNew ? "/api/admin/products" : `/api/admin/products/${params.id}`;

      const payload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        brand: formData.brand,
        categoryId: formData.categoryId,
        basePrice: formData.basePrice,
        sellingPrice: formData.sellingPrice,
        gstPercent: formData.gstPercent,
        discountPercent: formData.discountPercent,
        stockQuantity: formData.stockQuantity,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        images: formData.images
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to save product");
      }

      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  if (!session) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-6 pb-12"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button variant="outline" size="icon" className="rounded-full shadow-sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {isNew ? "Create New Product" : "Edit Product"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isNew ? "Add a new product to your catalog" : `Updating ${formData.name}`}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Link href="/admin/products">
            <Button variant="outline" className="shadow-sm border-border hover:bg-muted text-foreground">Cancel</Button>
          </Link>
          <Button onClick={handleSubmit} disabled={saving} className="shadow-md bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity border-0">
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></span>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isNew ? "Create Product" : "Save Changes"}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 border border-red-100 text-red-800 p-4 rounded-xl flex items-start gap-3 shadow-sm"
          >
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="font-medium text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* General Information */}
          <div className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden">
            <div className="border-b border-border bg-muted/30 px-6 py-4">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" /> General Information
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground/80">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Premium Wireless Headphones"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground/80">
                  Slug <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="premium-wireless-headphones"
                    className="flex-1 px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    required
                  />
                  <Button type="button" variant="secondary" onClick={generateSlug} className="rounded-xl">
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">The URL friendly identifier for this product.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground/80">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Write a detailed description of the product..."
                  rows={5}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-y"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden">
            <div className="border-b border-border bg-muted/30 px-6 py-4">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Percent className="w-4 h-4 text-primary" /> Pricing & Inventory
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground/80">Base Price (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                    <input
                      type="number"
                      name="basePrice"
                      value={formData.basePrice || ""}
                      onChange={handleChange}
                      min="0"
                      className="w-full pl-8 pr-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground/80">
                    Selling Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                    <input
                      type="number"
                      name="sellingPrice"
                      value={formData.sellingPrice || ""}
                      onChange={handleChange}
                      min="0"
                      required
                      className="w-full pl-8 pr-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground/80">Discount (%)</label>
                  <input
                    type="number"
                    name="discountPercent"
                    value={formData.discountPercent || ""}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground/80">GST (%)</label>
                  <input
                    type="number"
                    name="gstPercent"
                    value={formData.gstPercent || ""}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground/80">Stock Quantity</label>
                  <input
                    type="number"
                    name="stockQuantity"
                    value={formData.stockQuantity || ""}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          
          {/* Organization */}
          <div className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden">
            <div className="border-b border-border bg-muted/30 px-6 py-4">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" /> Organization
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground/80">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  required
                >
                  <option value="">Select Category...</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground/80">Brand</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand || ""}
                  onChange={handleChange}
                  placeholder="e.g. Apple, Nike"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-border/50">
                <label className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      className="w-5 h-5 accent-primary rounded cursor-pointer"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Active Status</p>
                    <p className="text-xs text-muted-foreground">Product will be visible to customers.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      checked={formData.isFeatured}
                      onChange={handleChange}
                      className="w-5 h-5 accent-primary rounded cursor-pointer"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Featured</p>
                    <p className="text-xs text-muted-foreground">Highlight product on the homepage.</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Media/Images */}
          <div className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden">
            <div className="border-b border-border bg-muted/30 px-6 py-4">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" /> Media & Images
              </h2>
            </div>
            <div className="p-6 space-y-6">
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex gap-2">
                  <input 
                    type="url" 
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://image-url.com/img.jpg"
                    className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  <Button type="button" onClick={handleAddImage} size="icon" className="shrink-0 rounded-lg">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground hidden sm:block">or</span>
                  <label className="flex items-center justify-center cursor-pointer bg-muted hover:bg-muted/80 text-foreground text-sm font-medium px-4 py-2 rounded-lg border border-border transition-colors h-10 w-full sm:w-auto whitespace-nowrap">
                    {uploadingImage ? "Uploading..." : "Upload File"}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFileUpload} 
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
              </div>

              {formData.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {formData.images.map((img, index) => (
                    <div 
                      key={index} 
                      className={`relative group rounded-xl overflow-hidden border-2 aspect-square bg-muted ${img.isPrimary ? 'border-primary shadow-md' : 'border-border/50'}`}
                    >
                      <img 
                        src={img.url} 
                        alt="Product" 
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=Invalid+Image'; }}
                      />
                      
                      {img.isPrimary && (
                        <div className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                          Primary
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        {!img.isPrimary && (
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="secondary" 
                            className="h-7 text-xs rounded-full shadow-sm"
                            onClick={() => handleSetPrimaryImage(index)}
                          >
                            Set Primary
                          </Button>
                        )}
                        <Button 
                          type="button" 
                          size="icon" 
                          variant="destructive" 
                          className="h-7 w-7 rounded-full shadow-sm"
                          onClick={() => handleRemoveImage(index)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-border rounded-xl bg-muted/20">
                  <ImageIcon className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">No images added</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Paste a URL above to add an image</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </form>
    </motion.div>
  );
}
