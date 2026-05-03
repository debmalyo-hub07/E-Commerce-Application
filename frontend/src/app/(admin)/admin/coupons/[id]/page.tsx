"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Ticket,
  Percent,
  Banknote,
  Calendar,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Coupon {
  _id: string;
  code: string;
  type: "PERCENTAGE" | "FLAT";
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit?: number;
  isActive: boolean;
  expiresAt?: string;
}

export default function CouponForm() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const isNew = params.id === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Coupon>({
    _id: "",
    code: "",
    type: "PERCENTAGE",
    value: 0,
    minOrderValue: undefined,
    maxDiscount: undefined,
    usageLimit: undefined,
    isActive: true,
    expiresAt: undefined,
  });

  useEffect(() => {
    if (!session) return;

    const fetchCoupon = async () => {
      if (isNew) return;
      try {
        const response = await fetch(`/api/admin/coupons/${params.id}`);
        if (!response.ok) throw new Error("Failed to fetch coupon");
        const data = await response.json();
        setFormData(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load coupon");
      } finally {
        setLoading(false);
      }
    };

    fetchCoupon();
  }, [session, isNew, params.id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (!formData.code.trim()) throw new Error("Coupon code is required");
      if (formData.value <= 0) throw new Error("Value must be positive");
      if (formData.type === "PERCENTAGE" && formData.value > 100) {
        throw new Error("Percentage value cannot exceed 100");
      }

      const method = isNew ? "POST" : "PUT";
      const url = isNew ? "/api/admin/coupons" : `/api/admin/coupons/${params.id}`;

      const submitData = {
        code: formData.code.toUpperCase(),
        type: formData.type,
        value: formData.value,
        ...(formData.minOrderValue && { minOrderValue: formData.minOrderValue }),
        ...(formData.maxDiscount && { maxDiscount: formData.maxDiscount }),
        ...(formData.usageLimit && { usageLimit: formData.usageLimit }),
        ...(formData.expiresAt && { expiresAt: formData.expiresAt }),
        isActive: formData.isActive,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to save coupon");
      }

      alert(`Coupon ${isNew ? "created" : "updated"} successfully!`);
      router.push("/admin/coupons");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save coupon");
    } finally {
      setSaving(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to access admin panel.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl mx-auto pb-10"
    >
      <div className="flex items-center gap-4">
        <Link
          href="/admin/coupons"
          className="p-2 rounded-xl hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isNew ? "Create New Coupon" : "Edit Coupon"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isNew
              ? "Create a new discount coupon for your customers"
              : `Editing coupon: ${formData.code}`}
          </p>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-800 font-medium text-sm flex items-center gap-2 shadow-sm"
        >
          <AlertCircle className="w-4 h-4" /> {error}
        </motion.div>
      )}

      <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
        <div className="px-6 py-5 border-b border-border bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Ticket className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Coupon Details</h2>
              <p className="text-sm text-muted-foreground">
                Configure discount type, value, and restrictions
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Coupon Code <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="E.g., SUMMER20"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-foreground font-mono uppercase"
                  required
                  disabled={!isNew}
                />
              </div>
              {!isNew && (
                <p className="text-xs text-muted-foreground mt-1">
                  Code cannot be changed after creation
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Discount Type <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-foreground"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FLAT">Flat (₹)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Discount Value <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                {formData.type === "PERCENTAGE" ? (
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                ) : (
                  <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                )}
                <input
                  type="number"
                  name="value"
                  value={formData.value || ""}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  max={formData.type === "PERCENTAGE" ? 100 : undefined}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-foreground"
                  placeholder={formData.type === "PERCENTAGE" ? "0 - 100" : "0"}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formData.type === "PERCENTAGE"
                  ? "Enter percentage (0-100)"
                  : "Enter amount in rupees"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Minimum Order Value (₹)
              </label>
              <input
                type="number"
                name="minOrderValue"
                value={formData.minOrderValue || ""}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-foreground"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Maximum Discount (₹)
              </label>
              <input
                type="number"
                name="maxDiscount"
                value={formData.maxDiscount || ""}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-foreground"
                placeholder="No cap"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Only applicable for percentage-based coupons
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Usage Limit
              </label>
              <input
                type="number"
                name="usageLimit"
                value={formData.usageLimit || ""}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-foreground"
                placeholder="Unlimited"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty for unlimited uses
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Expiration Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="datetime-local"
                name="expiresAt"
                value={
                  formData.expiresAt
                    ? new Date(formData.expiresAt).toISOString().slice(0, 16)
                    : ""
                }
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    expiresAt: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : undefined,
                  }));
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-foreground"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty for no expiration
            </p>
          </div>

          <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl border border-border/50">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-5 h-5 rounded border-border text-primary focus:ring-primary/50"
            />
            <label htmlFor="isActive" className="text-sm font-semibold text-foreground">
              Active
            </label>
            <span className="text-xs text-muted-foreground">
              — Coupon can be used by customers
            </span>
          </div>

          <div className="flex gap-4 pt-6 border-t border-border">
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : isNew ? (
                "Create Coupon"
              ) : (
                "Update Coupon"
              )}
            </Button>
            <Link href="/admin/coupons">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </motion.div>
  );
}