"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Zap, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

interface DiscountAlert {
  text: string;
  discount?: number;
  link?: string;
  emoji?: string;
}

const alerts: DiscountAlert[] = [
  { text: "SUMMER SALE", discount: 50, link: "/products?sort=discount", emoji: "✨" },
  { text: "FREE PREMIUM SHIPPING on orders above ₹1,000", link: "/products", emoji: "📦" },
  { text: "Extra 20% OFF with credit cards", discount: 20, emoji: "💳" },
  { text: "Flat ₹500 OFF on first order", discount: 500, emoji: "🎁" },
  { text: "Flash Deal - Limited Time Only!", discount: 40, link: "/products", emoji: "⚡" },
];

export function EnhancedDiscountNotification() {
  const [isVisible, setIsVisible] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-rotate alerts
  useEffect(() => {
    if (!autoPlay || !isMounted) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % alerts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoPlay, isMounted]);

  if (!isVisible) return null;

  const alert = alerts[currentIndex];

  const handlePrev = () => {
    setAutoPlay(false);
    setCurrentIndex((prev) => (prev - 1 + alerts.length) % alerts.length);
  };

  const handleNext = () => {
    setAutoPlay(false);
    setCurrentIndex((prev) => (prev + 1) % alerts.length);
  };

  const containerVariants = {
    initial: { opacity: 0, height: 0 },
    animate: {
      opacity: 1,
      height: "auto",
      transition: { duration: 0.4, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: { duration: 0.3, ease: "easeIn" },
    },
  };

  const textVariants = {
    initial: { opacity: 0, y: 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="relative w-full overflow-hidden bg-slate-950 text-slate-100 border-b border-slate-800"
        >
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 animate-pulse" />

          {/* Floating particles effect - Only render on client to prevent hydration mismatch */}
          {isMounted && Array.from({ length: 3 }).map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute w-1 h-1 bg-white/30 rounded-full"
              animate={{
                y: [0, -40, 0],
                x: [Math.random() * 20 - 10, Math.random() * 20 - 10],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                left: `${20 + Math.random() * 60}%`,
                bottom: '10%',
              }}
            />
          ))}

          {/* Main Content */}
          <div className="relative z-20 max-w-7xl mx-auto px-4 py-2.5">
            <div className="flex items-center justify-between gap-4">
              {/* Left Navigation */}
              <button
                onClick={handlePrev}
                className="p-1 hover:bg-slate-800 rounded-md transition-colors flex-shrink-0 hidden sm:block text-slate-400 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Alert Content */}
              <div className="flex-1 flex items-center justify-center gap-3 min-w-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    variants={textVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="flex items-center gap-3"
                  >
                    <span className="text-lg hidden sm:inline-block">{alert.emoji}</span>
                    <p className="font-medium text-sm sm:text-base tracking-wide text-slate-200">
                      {alert.text}
                    </p>
                    {alert.discount && (
                      <span className="inline-flex items-center gap-1 bg-gradient-to-r from-indigo-500 to-purple-500 px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-sm">
                        <Zap className="w-3 h-3 fill-current" />
                        {typeof alert.discount === "number" && alert.discount > 100
                          ? `₹${alert.discount}`
                          : `${alert.discount}%`}
                      </span>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Right Navigation & Close */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Navigation dots */}
                <div className="hidden sm:flex items-center gap-1.5 px-3">
                  {alerts.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentIndex(idx);
                        setAutoPlay(false);
                      }}
                      className={`rounded-full transition-all duration-300 ${
                        idx === currentIndex 
                          ? "w-4 h-1.5 bg-indigo-500" 
                          : "w-1.5 h-1.5 bg-slate-700 hover:bg-slate-500"
                      }`}
                    />
                  ))}
                </div>

                {/* Next button */}
                <button
                  onClick={handleNext}
                  className="p-1 hover:bg-slate-800 rounded-md transition-colors flex-shrink-0 hidden sm:block text-slate-400 hover:text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <div className="w-px h-4 bg-slate-800 mx-1 hidden sm:block" />

                {/* Close button */}
                <button
                  onClick={() => setIsVisible(false)}
                  className="p-1 hover:bg-slate-800 rounded-md transition-colors flex-shrink-0 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Auto-play progress indicator */}
            {autoPlay && isMounted && (
              <motion.div
                className="absolute bottom-0 left-0 h-[2px] bg-indigo-500/50 origin-left"
                key={currentIndex}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 5, ease: "linear" }}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

