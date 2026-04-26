"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
    minOrderValue: 0,
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

    try {
      if (!formData.code.trim()) throw new Error("Coupon code is required");
      if (formData.value <= 0) throw new Error("Value must be positive");

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
      alert(err instanceof Error ? err.message : "Failed to save coupon");
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
        <p>Loading coupon...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h1 className="text-3xl font-bold text-gray-900">
              {isNew ? "Create New Coupon" : "Edit Coupon"}
            </h1>
          </div>

          {error && (
            <div className="px-6 py-4 bg-red-50 border-b text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Coupon Code <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="E.g., SUMMER20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                  required
                  disabled={!isNew}
                />
                {!isNew && (
                  <p className="text-xs text-gray-500 mt-1">Code cannot be changed</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Discount Type <span className="text-red-600">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FLAT">Flat (₹)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Discount Value <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  name="value"
                  value={formData.value}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.type === "PERCENTAGE" ? "Enter percentage (0-100)" : "Enter amount in rupees"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Minimum Order Value (₹)
                </label>
                <input
                  type="number"
                  name="minOrderValue"
                  value={formData.minOrderValue || ""}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Maximum Discount (₹)
                </label>
                <input
                  type="number"
                  name="maxDiscount"
                  value={formData.maxDiscount || ""}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Only for percentage-based coupons</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Usage Limit
                </label>
                <input
                  type="number"
                  name="usageLimit"
                  value={formData.usageLimit || ""}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Expiration Date
              </label>
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
                    expiresAt: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty for no expiration</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Active (coupon can be used)
              </label>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : isNew ? "Create Coupon" : "Update Coupon"}
              </button>
              <Link
                href="/admin/coupons"
                className="flex-1 px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
    </div>
  );
}
