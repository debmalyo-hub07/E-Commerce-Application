"use client";

import Link from "next/link";
import { Heart } from "lucide-react";

export default function WishlistPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
        <Heart className="w-6 h-6 text-primary" />
        My Wishlist
      </h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <Heart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <p className="text-gray-600 mb-6 text-lg">Your wishlist is currently empty.</p>
        <Link href="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all">
          Browse Products
        </Link>
      </div>
    </div>
  );
}
