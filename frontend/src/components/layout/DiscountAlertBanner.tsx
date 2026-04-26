"use client";

import { motion } from "framer-motion";
import { Zap, X } from "lucide-react";
import { useState } from "react";

interface DiscountAlert {
  text: string;
  discount?: number;
  link?: string;
}

const alerts: DiscountAlert[] = [
  { text: "🎉 SUMMER SALE", discount: 50, link: "/products?sort=discount" },
  { text: "📦 FREE SHIPPING on orders above ₹999", link: "/products" },
  { text: "💳 Extra 20% OFF with credit cards", discount: 20 },
  { text: "🎁 Flat ₹500 OFF on first order", discount: 500 },
];

export function DiscountAlertBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isVisible) return null;

  const alert = alerts[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="relative overflow-hidden bg-gradient-to-r from-amber-400 via-orange-400 to-red-500 text-black py-3"
      style={{
        background: "linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ef4444 100%)",
      }}
    >
      {/* Animated background glow */}
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          background: [
            "radial-gradient(circle at 0% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)",
            "radial-gradient(circle at 100% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)",
            "radial-gradient(circle at 0% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)",
          ],
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 flex-1 min-w-0"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            >
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 drop-shadow-lg" />
            </motion.div>

            <motion.span
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="font-bold text-sm sm:text-base truncate drop-shadow-sm"
            >
              {alert.text}
            </motion.span>

            {alert.discount && (
              <motion.span
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.3 }}
                className="inline-flex items-center gap-1 bg-white/30 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap drop-shadow-md"
              >
                <motion.span
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                >
                  {alert.discount}%
                </motion.span>
              </motion.span>
            )}
          </motion.div>

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Navigation dots */}
            <motion.div className="hidden sm:flex items-center gap-1">
              {alerts.map((_, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentIndex ? "bg-white w-6" : "bg-white/50"
                  }`}
                />
              ))}
            </motion.div>

            {/* Close button */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-white/20 rounded-md transition-colors"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
          </div>
        </div>

        {/* Animated shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: [-1000, 1000] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Auto-rotate alerts */}
      <motion.div
        className="absolute -bottom-1 left-0 right-0 h-1 bg-white/30"
        animate={{ scaleX: [0, 1] }}
        transition={{
          duration: 5,
          repeat: Infinity,
          onRepeatCycleCatch: () => {
            setCurrentIndex((prev) => (prev + 1) % alerts.length);
          },
        }}
      />
    </motion.div>
  );
}
