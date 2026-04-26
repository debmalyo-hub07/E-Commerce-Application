"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Address {
  _id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Address>>({
    label: "Home",
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    isDefault: false,
  });

  useEffect(() => {
    if (!session) return;
    fetchAddresses();
  }, [session]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/addresses");
      if (!response.ok) throw new Error("Failed to fetch addresses");
      const data = await response.json();
      setAddresses(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/user/addresses/${editingId}` : "/api/user/addresses";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to save address");
      }

      await fetchAddresses();
      setShowForm(false);
      setEditingId(null);
      setFormData({
        label: "Home",
        fullName: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
        isDefault: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save address");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const response = await fetch(`/api/user/addresses/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete address");
      await fetchAddresses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete address");
    }
  };

  const handleEdit = (address: Address) => {
    setFormData(address);
    setEditingId(address._id);
    setShowForm(true);
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to view your addresses.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Addresses</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            if (showForm) {
              setFormData({
                label: "Home",
                fullName: "",
                phone: "",
                addressLine1: "",
                addressLine2: "",
                city: "",
                state: "",
                pincode: "",
                country: "India",
                isDefault: false,
              });
            }
          }}
          className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-sm"
        >
          {showForm ? "Cancel" : "+ Add Address"}
        </button>
      </div>

      {error && <div className="bg-red-50 p-4 rounded-xl mb-6 text-red-800 border border-red-100">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl shadow-lg border border-border p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <h2 className="text-xl font-bold text-foreground mb-6 relative z-10">
            {editingId ? "Edit Address" : "Add New Address"}
          </h2>

          <div className="grid grid-cols-2 gap-6 mb-5 relative z-10">
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Label</label>
              <select
                name="label"
                value={formData.label}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              >
                <option>Home</option>
                <option>Work</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground/80 mb-2">Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-5">
            <div>
              <label className="block text-sm font-semibold text-foreground/80 mb-2">Phone *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit number"
                required
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground/80 mb-2">Address Line 1 *</label>
              <input
                type="text"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleChange}
                placeholder="Street address"
                required
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-foreground"
              />
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-semibold text-foreground/80 mb-2">Address Line 2</label>
            <input
              type="text"
              name="addressLine2"
              value={formData.addressLine2}
              onChange={handleChange}
              placeholder="Apartment, suite, etc. (optional)"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-foreground"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-foreground/80 mb-2">City *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground/80 mb-2">State *</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground/80 mb-2">Pincode *</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="6-digit"
                required
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-foreground"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 mb-8 bg-muted/30 p-4 rounded-xl border border-border relative z-10">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleChange}
                className="w-5 h-5 rounded border-border text-primary focus:ring-primary bg-background"
              />
              <span className="text-sm font-medium text-foreground">Set as default delivery address</span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-md relative z-10"
          >
            {editingId ? "Update Address" : "Save Address"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-12 text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading addresses...</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📍</span>
          </div>
          <p className="text-muted-foreground mb-6 text-lg">No addresses saved yet.</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-md"
          >
            Add your first address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((address) => (
            <div key={address._id} className="bg-card rounded-2xl shadow-md border border-border p-6 relative group overflow-hidden hover:border-purple-500/50 hover:shadow-purple-500/10 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>
              {address.isDefault && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-2xl tracking-wider uppercase shadow-md">
                  Default
                </div>
              )}
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <h3 className="font-bold text-foreground flex items-center gap-2 text-lg">
                    {address.label}
                  </h3>
                </div>
              </div>

              <div className="text-muted-foreground text-sm space-y-1.5 mb-6 relative z-10">
                <p className="font-bold text-foreground">{address.fullName}</p>
                <p className="font-medium text-primary/80">{address.phone}</p>
                <p className="mt-2">{address.addressLine1}</p>
                {address.addressLine2 && <p>{address.addressLine2}</p>}
                <p>
                  {address.city}, {address.state} <span className="font-semibold text-foreground">{address.pincode}</span>
                </p>
                <p>{address.country}</p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border relative z-10">
                <button
                  onClick={() => handleEdit(address)}
                  className="flex-1 py-2 text-sm font-semibold text-primary bg-primary/10 hover:bg-primary hover:text-white rounded-xl transition-all duration-300"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(address._id)}
                  className="flex-1 py-2 text-sm font-semibold text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white rounded-xl transition-all duration-300"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
