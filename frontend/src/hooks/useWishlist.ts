import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserStore } from "@/store/userStore";
import { toast } from "react-hot-toast";

export function useWishlist() {
  const { wishlistIds, addToWishlist, removeFromWishlist, isInWishlist } =
    useUserStore();
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async (productId: string) => {
      const res = await fetch("/api/user/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) throw new Error("Failed to add to wishlist");
      return res.json();
    },
    onMutate: (productId) => {
      addToWishlist(productId); // optimistic
    },
    onError: (_, productId) => {
      removeFromWishlist(productId); // rollback
      toast.error("Could not add to wishlist");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Added to wishlist!", { icon: "❤️" });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (productId: string) => {
      const res = await fetch(`/api/user/wishlist?productId=${productId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove from wishlist");
      return res.json();
    },
    onMutate: (productId) => {
      removeFromWishlist(productId); // optimistic
    },
    onError: (_, productId) => {
      addToWishlist(productId); // rollback
      toast.error("Could not remove from wishlist");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  const toggleWishlist = useCallback(
    (productId: string, productName?: string) => {
      if (isInWishlist(productId)) {
        removeMutation.mutate(productId);
      } else {
        addMutation.mutate(productId);
        if (productName) {
          toast.success(`${productName} saved to wishlist`, { icon: "❤️" });
        }
      }
    },
    [isInWishlist, addMutation, removeMutation]
  );

  return {
    wishlistIds,
    isInWishlist,
    toggleWishlist,
    addToWishlist: addMutation.mutate,
    removeFromWishlist: removeMutation.mutate,
    isLoading: addMutation.isPending || removeMutation.isPending,
    count: wishlistIds.length,
  };
}
