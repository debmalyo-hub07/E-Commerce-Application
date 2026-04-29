"use client";

import { useCartStore } from "@/store/cartStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";
import { formatCurrency } from "@nexmart/shared/utils";

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, shipping, total, couponCode, couponDiscount, removeCoupon } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-muted-foreground mb-6">Looks like you haven&apos;t added anything yet.</p>
        <Link
          href="/products"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/products" className="p-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">Shopping Cart</h1>
        <span className="text-sm text-muted-foreground">({items.length} items)</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={`${item.product.id}-${item.variant?.id ?? "default"}`}
              className="flex gap-4 p-4 bg-card border border-border rounded-2xl"
            >
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0 relative">
                {item.product.imageUrl ? (
                  <Image
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.product.slug}`} className="font-semibold text-sm hover:text-primary transition-colors line-clamp-1">
                  {item.product.name}
                </Link>
                {item.product.brand && (
                  <p className="text-xs text-muted-foreground mt-0.5">{item.product.brand}</p>
                )}
                {item.variant && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.variant.name}: {item.variant.value}
                  </p>
                )}

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.variant?.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.variant?.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                      disabled={item.quantity >= 10}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm">{formatCurrency(item.finalPrice * item.quantity)}</span>
                    <button
                      onClick={() => removeItem(item.product.id, item.variant?.id)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-card border border-border rounded-2xl p-6 h-fit sticky top-24">
          <h2 className="font-bold text-lg mb-4">Order Summary</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal())}</span>
            </div>

            {couponCode && couponDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Coupon ({couponCode})</span>
                <div className="flex items-center gap-2">
                  <span>-{formatCurrency(couponDiscount)}</span>
                  <button onClick={removeCoupon} className="text-xs underline hover:no-underline">Remove</button>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{shipping() === 0 ? "Free" : formatCurrency(shipping())}</span>
            </div>

            <div className="border-t border-border pt-3 flex justify-between font-bold text-base">
              <span>Total</span>
              <span>{formatCurrency(total())}</span>
            </div>
          </div>

          <Link
            href="/checkout"
            className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Proceed to Checkout
          </Link>

          <p className="text-xs text-muted-foreground text-center mt-3">
            Free shipping on orders above ₹1,000
          </p>
        </div>
      </div>
    </div>
  );
}
