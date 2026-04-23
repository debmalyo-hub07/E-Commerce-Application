import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCartStore, type CartItemState } from "@/store/cartStore";
import { toast } from "react-hot-toast";

interface AddToCartParams {
  product: CartItemState["product"];
  variant?: CartItemState["variant"];
  quantity?: number;
  unitPrice: number;
  gstPercent: number;
  discountPercent: number;
  finalPrice: number;
}

export function useCart() {
  const {
    items,
    isOpen,
    couponCode,
    couponDiscount,
    isLoading,
    subtotal,
    gstAmount,
    shipping,
    total,
    itemCount,
    openCart,
    closeCart,
    toggleCart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
    hydrateFromServer,
  } = useCartStore();

  const queryClient = useQueryClient();

  // ── Add to cart with optimistic update + toast ────────────
  const addToCart = useCallback(
    (params: AddToCartParams) => {
      addItem(params);
      toast.success(`${params.product.name} added to cart!`, {
        icon: "🛒",
        duration: 2000,
      });
    },
    [addItem]
  );

  // ── Remove with toast ──────────────────────────────────────
  const removeFromCart = useCallback(
    (productId: string, variantId?: string, productName?: string) => {
      removeItem(productId, variantId);
      if (productName) {
        toast(`${productName} removed`, { icon: "🗑️", duration: 1500 });
      }
    },
    [removeItem]
  );

  // ── Coupon validation mutation ─────────────────────────────
  const couponMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await fetch("/api/user/cart/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, orderSubtotal: subtotal() }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error ?? "Invalid coupon");
      return data.data as { discount: number; type: string };
    },
    onSuccess: (data, code) => {
      applyCoupon(code, data.discount);
      toast.success(`Coupon applied! You save ₹${data.discount}`, { icon: "🎉" });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error: Error) => {
      toast.error(error.message, { icon: "❌" });
    },
  });

  return {
    // State
    items,
    isOpen,
    couponCode,
    couponDiscount,
    isLoading,

    // Computed
    subtotal: subtotal(),
    gstAmount: gstAmount(),
    shipping: shipping(),
    total: total(),
    itemCount: itemCount(),
    isEmpty: items.length === 0,

    // Actions
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
    removeCoupon,
    validateCoupon: couponMutation.mutate,
    isCouponLoading: couponMutation.isPending,
  };
}
