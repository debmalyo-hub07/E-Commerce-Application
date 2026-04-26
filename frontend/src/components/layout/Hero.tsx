"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowLeft } from "lucide-react";

const slides = [
  {
    id: 1,
    title: "Summer Collection\n2026",
    subtitle: "Discover premium fashion curated for you",
    cta: "Shop Fashion",
    ctaHref: "/products?category=fashion",
    bg: "from-violet-600 via-purple-600 to-indigo-700",
    badge: "Up to 60% OFF",
    image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Next-Gen\nElectronics",
    subtitle: "The latest smartphones, laptops, and audio gear",
    cta: "Explore Electronics",
    ctaHref: "/products?category=electronics",
    bg: "from-sky-500 via-blue-600 to-indigo-600",
    badge: "New Arrivals",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Refresh Your\nHome",
    subtitle: "Beautiful furniture and décor for every room",
    cta: "Shop Home",
    ctaHref: "/products?category=home-kitchen",
    bg: "from-emerald-500 via-teal-600 to-cyan-600",
    badge: "Free Delivery",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&auto=format&fit=crop",
  },
];

export function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoPlay]);

  const prev = () => {
    setAutoPlay(false);
    setCurrent((c) => (c - 1 + slides.length) % slides.length);
  };
  const next = () => {
    setAutoPlay(false);
    setCurrent((c) => (c + 1) % slides.length);
  };

  const slide = slides[current];

  return (
    <section className="relative h-[480px] sm:h-[560px] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className={`absolute inset-0 bg-gradient-to-r ${slide.bg} flex items-center`}
        >
          {/* Background image with overlay */}
          <div className="absolute inset-0 opacity-15">
            <Image
              src={slide.image}
              alt=""
              fill
              className="object-cover"
              priority={current === 0}
              aria-hidden="true"
              unoptimized={true}
            />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full">
            <div className="max-w-lg">
              {/* Badge */}
              <motion.span
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-sm text-white text-sm font-bold rounded-full mb-4 border border-white/30"
              >
                🔥 {slide.badge}
              </motion.span>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl sm:text-6xl font-outfit font-bold text-white leading-tight mb-4 whitespace-pre-line"
              >
                {slide.title}
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-white/80 text-lg mb-8 leading-relaxed"
              >
                {slide.subtitle}
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex gap-3"
              >
                <Link
                  href={slide.ctaHref}
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-gray-900 font-bold rounded-xl hover:bg-white/90 transition-all hover:scale-105 active:scale-95 shadow-lg"
                >
                  {slide.cta} <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/30"
                >
                  View All
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center border border-white/20 z-20"
        aria-label="Previous slide"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center border border-white/20 z-20"
        aria-label="Next slide"
      >
        <ArrowRight className="w-5 h-5" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => { setAutoPlay(false); setCurrent(i); }}
            className={`transition-all duration-300 rounded-full ${
              i === current
                ? "w-8 h-2 bg-white"
                : "w-2 h-2 bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
