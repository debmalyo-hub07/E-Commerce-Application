import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  brand?: string;
}

export interface CartVariant {
  id: string;
  name: string;
  value: string;
  price_modifier: number;
}

export interface CartItemState {
  cartItemId?: string; // server-side cart item ID when synced
  product: CartProduct;
  variant?: CartVariant;
  quantity: number;
  unitPrice: number; // selling_price + variant modifier
  gstPercent: number;
  discountPercent: number;
  finalPrice: number; // computed: unitPrice × (1 - discount%/100) × (1 + gst%/100)
}

interface CartState {
  items: CartItemState[];
  isOpen: boolean;
  couponCode: string;
  couponDiscount: number;
  isLoading: boolean;

  // Computed
  subtotal: () => number;
  gstAmount: () => number;
  shipping: () => number;
  total: () => number;
  itemCount: () => number;

  // Actions
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: Omit<CartItemState, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  setLoading: (loading: boolean) => void;
  hydrateFromServer: (items: CartItemState[]) => void;
}

const FREE_SHIPPING_THRESHOLD = 1000;
const SHIPPING_CHARGE = 50;

export const useCartStore = create<CartState>()(
  devtools(
    persist(
      immer((set, get) => ({
        items: [],
        isOpen: false,
        couponCode: "",
        couponDiscount: 0,
        isLoading: false,

        // ── Computed (functions called inline) ────────────────
        subtotal: () =>
          get().items.reduce(
            (sum, item) => sum + item.finalPrice * item.quantity,
            0
          ),

        gstAmount: () =>
          get().items.reduce((sum, item) => {
            const priceAfterDiscount =
              item.unitPrice * (1 - item.discountPercent / 100);
            const gst = priceAfterDiscount * (item.gstPercent / 100);
            return sum + gst * item.quantity;
          }, 0),

        shipping: () => {
          const sub = get().subtotal();
          return sub >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;
        },

        total: () => {
          const sub = get().subtotal();
          const discount = get().couponDiscount;
          const ship = get().shipping();
          return Math.max(0, sub - discount + ship);
        },

        itemCount: () =>
          get().items.reduce((sum, item) => sum + item.quantity, 0),

        // ── Actions ───────────────────────────────────────────
        openCart: () => set({ isOpen: true }),
        closeCart: () => set({ isOpen: false }),
        toggleCart: () => set((state) => { state.isOpen = !state.isOpen; }),

        addItem: (newItem) =>
          set((state) => {
            const existing = state.items.find(
              (i: CartItemState) =>
                i.product.id === newItem.product.id &&
                i.variant?.id === newItem.variant?.id
            );
            if (existing) {
              existing.quantity = Math.min(
                existing.quantity + (newItem.quantity ?? 1),
                10
              );
            } else {
              state.items.push({ ...newItem, quantity: newItem.quantity ?? 1 });
            }
            state.isOpen = true; // auto-open cart drawer on add
          }),

        removeItem: (productId, variantId) =>
          set((state) => {
            state.items = state.items.filter(
              (i: CartItemState) =>
                !(
                  i.product.id === productId &&
                  (variantId ? i.variant?.id === variantId : !i.variant)
                )
            );
          }),

        updateQuantity: (productId, variantId, quantity) =>
          set((state) => {
            const item = state.items.find(
              (i: CartItemState) =>
                i.product.id === productId &&
                (variantId ? i.variant?.id === variantId : !i.variant)
            );
            if (item) {
              item.quantity = Math.max(1, Math.min(quantity, 10));
            }
          }),

        clearCart: () =>
          set({ items: [], couponCode: "", couponDiscount: 0 }),

        applyCoupon: (code, discount) =>
          set({ couponCode: code, couponDiscount: discount }),

        removeCoupon: () =>
          set({ couponCode: "", couponDiscount: 0 }),

        setLoading: (loading) => set({ isLoading: loading }),

        hydrateFromServer: (items) => set({ items }),
      })),
      {
        name: "stylemart-cart",
        partialize: (state) => ({
          items: state.items,
          couponCode: state.couponCode,
          couponDiscount: state.couponDiscount,
        }),
      }
    ),
    { name: "CartStore" }
  )
);
