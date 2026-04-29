"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, ShoppingBag, Star, Shield, Truck } from "lucide-react";

const slides = [
  {
    id: 1,
    title: "Summer Collection",
    highlight: "2026",
    subtitle: "Discover premium fashion curated for the modern lifestyle. Quality meets affordability.",
    cta: "Shop Fashion",
    ctaHref: "/products?category=fashion",
    badge: "Up to 60% OFF",
    badgeIcon: "🔥",
    accentColor: "from-violet-500 via-purple-500 to-indigo-500",
    glowColor: "rgba(139, 92, 246, 0.3)",
  },
  {
    id: 2,
    title: "Next-Gen",
    highlight: "Electronics",
    subtitle: "The latest smartphones, laptops, and audio gear — all at prices you'll love.",
    cta: "Explore Tech",
    ctaHref: "/products?category=electronics",
    badge: "New Arrivals",
    badgeIcon: "⚡",
    accentColor: "from-blue-500 via-cyan-500 to-teal-500",
    glowColor: "rgba(6, 182, 212, 0.3)",
  },
  {
    id: 3,
    title: "Refresh Your",
    highlight: "Home",
    subtitle: "Beautiful furniture and décor for every room. Transform your living space today.",
    cta: "Shop Home",
    ctaHref: "/products?category=home-kitchen",
    badge: "Free Delivery",
    badgeIcon: "🚀",
    accentColor: "from-emerald-500 via-green-500 to-teal-500",
    glowColor: "rgba(16, 185, 129, 0.3)",
  },
];

const stats = [
  { value: "2M+", label: "Happy Customers" },
  { value: "50K+", label: "Products" },
  { value: "4.8★", label: "Average Rating" },
  { value: "24/7", label: "Support" },
];

export function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [autoPlay]);

  const slide = slides[current];

  return (
    <section className="relative min-h-[600px] sm:min-h-[680px] overflow-hidden dark-section">
      {/* ── Background Layers ── */}
      {/* Base gradient */}
      <div className="absolute inset-0 bg-[oklch(0.08_0.02_260)]" />
      
      {/* Dot grid pattern */}
      <div className="absolute inset-0 dot-pattern opacity-40" />

      {/* Animated gradient orbs */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`orb-${slide.id}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 pointer-events-none"
        >
          {/* Primary glow */}
          <motion.div
            animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full blur-[120px]"
            style={{ background: `radial-gradient(circle, ${slide.glowColor}, transparent 70%)` }}
          />
          {/* Secondary glow */}
          <motion.div
            animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] opacity-50"
            style={{ background: `radial-gradient(circle, ${slide.glowColor}, transparent 70%)` }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.08_0.02_260)] via-transparent to-[oklch(0.08_0.02_260)]/50 pointer-events-none" />

      {/* ── Content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center py-20 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
          {/* Left: Text Content */}
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6"
                >
                  <span className="text-base">{slide.badgeIcon}</span>
                  <span className="text-sm font-bold text-white/90 tracking-wide">{slide.badge}</span>
                  <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${slide.accentColor} animate-pulse`} />
                </motion.div>

                {/* Title */}
                <h1 className="font-outfit font-black text-5xl sm:text-6xl lg:text-7xl tracking-[-0.04em] leading-[1.05] mb-6 text-white">
                  {slide.title}
                  <br />
                  <span className={`bg-gradient-to-r ${slide.accentColor} bg-clip-text text-transparent`}>
                    {slide.highlight}
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-lg sm:text-xl text-white/60 leading-relaxed mb-8 max-w-xl font-medium">
                  {slide.subtitle}
                </p>

                {/* CTAs */}
                <div className="flex flex-wrap gap-4">
                  <Link
                    href={slide.ctaHref}
                    className={`group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r ${slide.accentColor} text-white font-bold rounded-2xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 shadow-lg`}
                    style={{ boxShadow: `0 8px 30px ${slide.glowColor}` }}
                  >
                    {slide.cta}
                    <span className="bg-white/20 p-1.5 rounded-lg group-hover:bg-white/30 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </Link>
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 px-8 py-4 glass-card text-white/80 font-semibold rounded-2xl hover:bg-white/10 hover:text-white transition-all duration-300"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Browse All
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Slide Indicators */}
            <div className="flex gap-2 mt-10">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setAutoPlay(false); setCurrent(i); }}
                  className={`transition-all duration-500 rounded-full ${
                    i === current
                      ? "w-10 h-2.5 bg-white"
                      : "w-2.5 h-2.5 bg-white/25 hover:bg-white/40"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right: Feature Cards Stack */}
          <div className="hidden lg:block relative">
            <motion.div
              animate={{ y: [-8, 8, -8] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              {/* Main floating card */}
              <div className="glass-card-elevated rounded-3xl p-8 relative">
                {/* Card header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${slide.accentColor} flex items-center justify-center`}>
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">NexMart Premium</p>
                      <p className="text-white/40 text-xs">Curated just for you</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-4">
                  {stats.map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="glass-card rounded-2xl p-4 text-center hover:bg-white/[0.08] transition-colors"
                    >
                      <p className={`text-2xl font-black bg-gradient-to-r ${slide.accentColor} bg-clip-text text-transparent`}>
                        {stat.value}
                      </p>
                      <p className="text-white/50 text-xs font-medium mt-1">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Trust strip */}
                <div className="mt-6 flex items-center justify-center gap-6 pt-5 border-t border-white/[0.06]">
                  {[
                    { icon: Shield, text: "Secure" },
                    { icon: Truck, text: "Free Ship" },
                    { icon: Star, text: "Top Rated" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-1.5 text-white/40 text-xs font-medium">
                      <Icon className="w-3.5 h-3.5" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decorative floating elements */}
              <motion.div
                animate={{ y: [0, -12, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -top-6 -right-6 glass-card rounded-2xl px-4 py-3 flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <span className="text-emerald-400 text-sm">✓</span>
                </div>
                <div>
                  <p className="text-white text-xs font-bold">Order Placed</p>
                  <p className="text-white/40 text-[10px]">Just now</p>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0], rotate: [0, -3, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute -bottom-4 -left-8 glass-card rounded-2xl px-4 py-3 flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                </div>
                <div>
                  <p className="text-white text-xs font-bold">4.9 Rating</p>
                  <p className="text-white/40 text-[10px]">12,400+ reviews</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
