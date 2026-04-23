"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, Search, Sun, Moon, Menu, X, Heart, User, Package,
  ChevronDown, Bell, LogOut, Settings, Shield,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useCart } from "@/hooks/useCart";
import { useUIStore } from "@/store/uiStore";
import { useDebounce } from "@/hooks/useDebounce";
import { useQuery } from "@tanstack/react-query";

const categories = [
  { name: "Electronics", slug: "electronics", sub: ["Smartphones", "Laptops", "Audio", "Cameras"] },
  { name: "Fashion", slug: "fashion", sub: ["Men's", "Women's", "Kids", "Accessories"] },
  { name: "Home & Kitchen", slug: "home-kitchen", sub: ["Furniture", "Appliances", "Decor", "Cookware"] },
  { name: "Sports", slug: "sports-fitness", sub: ["Fitness", "Cricket", "Football", "Yoga"] },
  { name: "Books", slug: "books", sub: ["Fiction", "Non-Fiction", "Academic", "Comics"] },
];

export function Navbar() {
  const { data: session } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const { itemCount, toggleCart } = useCart();
  const { isSearchOpen, openSearch, closeSearch, searchQuery, setSearchQuery } = useUIStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(searchQuery, 300);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    if (isSearchOpen) searchRef.current?.focus();
  }, [isSearchOpen]);

  // Live search suggestions
  const { data: suggestions = [] } = useQuery({
    queryKey: ["search-suggestions", debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.length < 2) return [];
      const res = await fetch(`/api/products?search=${encodeURIComponent(debouncedQuery)}&limit=5`);
      const data = await res.json();
      return data.data ?? [];
    },
    enabled: debouncedQuery.length >= 2,
  });

  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          isScrolled
            ? "bg-background/95 backdrop-blur-md shadow-md border-b border-border"
            : "bg-background border-b border-border"
        }`}
      >
        {/* Top announcement bar */}
        <div className="bg-primary text-primary-foreground text-center py-1.5 text-xs font-medium">
          🎉 Free shipping on orders above ₹1,000 · Use code <strong>WELCOME20</strong> for 20% off
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16 gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center"
              >
                <span className="text-primary-foreground font-bold text-sm">SM</span>
              </motion.div>
              <span className="font-outfit font-bold text-xl hidden sm:block">StyleMart</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 ml-4">
              {categories.map((cat) => (
                <div
                  key={cat.slug}
                  className="relative"
                  onMouseEnter={() => setActiveMegaMenu(cat.slug)}
                  onMouseLeave={() => setActiveMegaMenu(null)}
                >
                  <Link
                    href={`/products?category=${cat.slug}`}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                  >
                    {cat.name}
                    <ChevronDown className="w-3 h-3 opacity-60" />
                  </Link>

                  <AnimatePresence>
                    {activeMegaMenu === cat.slug && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-1 w-48 bg-popover border border-border rounded-xl shadow-xl p-2 z-50"
                      >
                        {cat.sub.map((sub) => (
                          <Link
                            key={sub}
                            href={`/products?category=${cat.slug}&sub=${sub.toLowerCase()}`}
                            className="block px-3 py-2 text-sm rounded-lg hover:bg-primary/5 hover:text-primary transition-colors"
                          >
                            {sub}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Search Bar */}
            <div className="relative hidden md:flex items-center">
              <AnimatePresence>
                {isSearchOpen ? (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 280, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="relative"
                  >
                    <input
                      ref={searchRef}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && searchQuery.trim()) {
                          window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
                        }
                        if (e.key === "Escape") closeSearch();
                      }}
                      placeholder="Search products..."
                      className="w-full pl-4 pr-10 py-2 text-sm bg-muted border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <button
                      onClick={closeSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Suggestions dropdown */}
                    <AnimatePresence>
                      {suggestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          className="absolute top-full mt-2 w-full bg-popover border border-border rounded-xl shadow-xl overflow-hidden z-50"
                        >
                          {suggestions.slice(0, 5).map((product: { id: string; slug: string; name: string; category?: { name: string }; final_price?: number }) => (
                            <Link
                              key={product.id}
                              href={`/products/${product.slug}`}
                              onClick={closeSearch}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-primary/5 transition-colors"
                            >
                              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium">{product.name}</p>
                                <p className="text-xs text-muted-foreground">{product.category?.name}</p>
                              </div>
                              <span className="ml-auto text-sm font-semibold text-primary">
                                ₹{product.final_price?.toLocaleString("en-IN")}
                              </span>
                            </Link>
                          ))}
                          <Link
                            href={`/search?q=${encodeURIComponent(searchQuery)}`}
                            onClick={closeSearch}
                            className="block px-4 py-3 text-sm text-primary font-medium border-t border-border hover:bg-primary/5"
                          >
                            See all results for "{searchQuery}" →
                          </Link>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.button
                    onClick={openSearch}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label="Open search"
                  >
                    <Search className="w-5 h-5" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Action Icons */}
            <div className="flex items-center gap-1">
              {/* Theme Toggle */}
              {mounted && (
                <motion.button
                  onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Toggle theme"
                >
                  {resolvedTheme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </motion.button>
              )}

              {/* Cart */}
              <motion.button
                onClick={toggleCart}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label={`Shopping cart with ${itemCount} items`}
              >
                <ShoppingCart className="w-5 h-5" />
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.span
                      key={itemCount}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center"
                    >
                      {itemCount > 99 ? "99+" : itemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Account / Auth */}
              {session?.user ? (
                <div className="relative group hidden sm:block">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 p-2 rounded-xl hover:bg-muted transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      {session.user.image ? (
                        <img src={session.user.image} alt="" className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-primary">
                          {session.user.name?.[0]?.toUpperCase() ?? "U"}
                        </span>
                      )}
                    </div>
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </motion.button>

                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-xl shadow-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="px-3 py-2 border-b border-border mb-1">
                      <p className="text-sm font-semibold">{session.user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                    </div>
                    {[
                      { href: "/account/profile", icon: User, label: "My Profile" },
                      { href: "/account/orders", icon: Package, label: "My Orders" },
                      { href: "/account/wishlist", icon: Heart, label: "Wishlist" },
                      { href: "/account/addresses", icon: Settings, label: "Addresses" },
                    ].map(({ href, icon: Icon, label }) => (
                      <Link key={href} href={href} className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-primary/5 hover:text-primary transition-colors">
                        <Icon className="w-4 h-4" />
                        {label}
                      </Link>
                    ))}
                    {isAdmin && (
                      <Link href="/admin/dashboard" className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-primary/5 hover:text-primary transition-colors border-t border-border mt-1 pt-2">
                        <Shield className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-destructive/5 hover:text-destructive transition-colors mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-muted transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="lg:hidden p-2 rounded-xl hover:bg-muted transition-colors"
                aria-label="Toggle mobile menu"
              >
                {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden border-t border-border bg-background overflow-hidden"
            >
              <div className="px-4 py-4 space-y-1">
                {/* Mobile search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-muted border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                    onKeyDown={(e) => {
                      const target = e.target as HTMLInputElement;
                      if (e.key === "Enter" && target.value.trim()) {
                        window.location.href = `/search?q=${encodeURIComponent(target.value)}`;
                      }
                    }}
                  />
                </div>

                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/products?category=${cat.slug}`}
                    className="block px-3 py-2.5 text-sm font-medium rounded-xl hover:bg-primary/5 hover:text-primary transition-colors"
                    onClick={() => setIsMobileOpen(false)}
                  >
                    {cat.name}
                  </Link>
                ))}

                <div className="pt-3 border-t border-border space-y-1">
                  {session ? (
                    <>
                      <Link href="/account/orders" className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl hover:bg-primary/5" onClick={() => setIsMobileOpen(false)}>
                        <Package className="w-4 h-4" /> My Orders
                      </Link>
                      <Link href="/account/wishlist" className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl hover:bg-primary/5" onClick={() => setIsMobileOpen(false)}>
                        <Heart className="w-4 h-4" /> Wishlist
                      </Link>
                      {isAdmin && (
                        <Link href="/admin/dashboard" className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl hover:bg-primary/5" onClick={() => setIsMobileOpen(false)}>
                          <Shield className="w-4 h-4" /> Admin
                        </Link>
                      )}
                      <button onClick={() => signOut()} className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl hover:bg-destructive/5 hover:text-destructive w-full text-left">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </>
                  ) : (
                    <div className="flex gap-2 px-1">
                      <Link href="/login" className="flex-1 text-center py-2.5 text-sm font-medium border border-border rounded-xl hover:bg-muted" onClick={() => setIsMobileOpen(false)}>Login</Link>
                      <Link href="/register" className="flex-1 text-center py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-xl" onClick={() => setIsMobileOpen(false)}>Sign Up</Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
