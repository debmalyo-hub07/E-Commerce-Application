import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface UserState {
  wishlistIds: string[];
  isWishlistLoading: boolean;

  // Actions
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  hydrateWishlist: (productIds: string[]) => void;
  clearWishlist: () => void;
  setLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      immer((set, get) => ({
        wishlistIds: [],
        isWishlistLoading: false,

        addToWishlist: (productId) =>
          set((state) => {
            if (!state.wishlistIds.includes(productId)) {
              state.wishlistIds.push(productId);
            }
          }),

        removeFromWishlist: (productId) =>
          set((state) => {
            state.wishlistIds = state.wishlistIds.filter((id: string) => id !== productId);
          }),

        isInWishlist: (productId) => get().wishlistIds.includes(productId),

        hydrateWishlist: (productIds) =>
          set((state) => {
            state.wishlistIds = productIds;
          }),

        clearWishlist: () =>
          set((state) => {
            state.wishlistIds = [];
          }),

        setLoading: (loading) =>
          set((state) => {
            state.isWishlistLoading = loading;
          }),
      })),
      {
        name: "stylemart-wishlist",
        partialize: (state) => ({ wishlistIds: state.wishlistIds }),
      }
    ),
    { name: "UserStore" }
  )
);
