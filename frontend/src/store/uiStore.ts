import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface UIState {
  isSearchOpen: boolean;
  isMobileNavOpen: boolean;
  isCartOpen: boolean;
  searchQuery: string;
  activeCategory: string | null;
  scrollY: number;
  theme: "light" | "dark" | "system";

  // Actions
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  setSearchQuery: (query: string) => void;
  setActiveCategory: (category: string | null) => void;
  setScrollY: (y: number) => void;
  closeAll: () => void; // close all overlays
}

export const useUIStore = create<UIState>()(
  devtools(
    immer((set) => ({
      isSearchOpen: false,
      isMobileNavOpen: false,
      isCartOpen: false,
      searchQuery: "",
      activeCategory: null,
      scrollY: 0,
      theme: "system",

      openSearch: () =>
        set((state) => {
          state.isSearchOpen = true;
          state.isMobileNavOpen = false;
        }),
      closeSearch: () =>
        set((state) => {
          state.isSearchOpen = false;
          state.searchQuery = "";
        }),
      toggleSearch: () =>
        set((state) => {
          state.isSearchOpen = !state.isSearchOpen;
        }),
      openMobileNav: () =>
        set((state) => {
          state.isMobileNavOpen = true;
          state.isSearchOpen = false;
        }),
      closeMobileNav: () =>
        set((state) => {
          state.isMobileNavOpen = false;
        }),
      setSearchQuery: (query) =>
        set((state) => {
          state.searchQuery = query;
        }),
      setActiveCategory: (category) =>
        set((state) => {
          state.activeCategory = category;
        }),
      setScrollY: (y) =>
        set((state) => {
          state.scrollY = y;
        }),
      closeAll: () =>
        set((state) => {
          state.isSearchOpen = false;
          state.isMobileNavOpen = false;
          state.isCartOpen = false;
        }),
    })),
    { name: "UIStore" }
  )
);
