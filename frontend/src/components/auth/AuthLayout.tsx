"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, Star, Shield, Truck, ArrowRight } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const features = [
  { icon: Shield, text: "Secure Checkout", sub: "256-bit encryption" },
  { icon: Truck, text: "Free Delivery", sub: "On orders above ₹1,000" },
  { icon: Star, text: "Top Rated", sub: "4.8★ from 12K+ reviews" },
];

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* ── Left Panel: Dark branding side ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative dark-section items-center justify-center p-12">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 dot-pattern opacity-20" />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-indigo-500/15 rounded-full blur-[100px]"
          />
          <motion.div
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[80px]"
          />
          {/* Bottom gradient fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[oklch(0.10_0.02_260)] to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-12 group">
            <motion.div
              whileHover={{ rotate: [0, -8, 8, 0] }}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25"
            >
              <span className="text-white font-extrabold text-xl tracking-tighter">NM</span>
            </motion.div>
            <span className="font-outfit font-black text-3xl tracking-tight text-white">NexMart</span>
          </Link>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="font-outfit text-4xl xl:text-5xl font-black tracking-[-0.03em] leading-tight text-white mb-4">
              Your gateway to{" "}
              <span className="text-gradient-primary">premium</span>{" "}
              shopping
            </h2>
            <p className="text-white/45 text-lg leading-relaxed mb-10">
              Join millions of shoppers who trust NexMart for quality products, secure payments, and lightning-fast delivery.
            </p>
          </motion.div>

          {/* Feature cards */}
          <div className="space-y-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="glass-card rounded-2xl p-4 flex items-center gap-4 group hover:bg-white/[0.06] transition-colors duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0 group-hover:from-indigo-500/30 group-hover:to-purple-500/30 transition-colors">
                  <feature.icon className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{feature.text}</p>
                  <p className="text-white/35 text-xs">{feature.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-10 flex items-center gap-3"
          >
            {/* Avatar stack */}
            <div className="flex -space-x-2">
              {["bg-indigo-500", "bg-purple-500", "bg-pink-500", "bg-cyan-500"].map((bg, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full ${bg} border-2 border-[oklch(0.10_0.02_260)] flex items-center justify-center text-white text-[10px] font-bold`}
                >
                  {["A", "S", "R", "K"][i]}
                </div>
              ))}
            </div>
            <div>
              <p className="text-white/60 text-xs font-medium">
                <span className="text-white font-bold">2M+</span> happy customers
              </p>
              <div className="flex items-center gap-0.5 mt-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                ))}
                <span className="text-white/40 text-[10px] ml-1">4.8/5</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Right Panel: Form side ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-background relative">
        {/* Subtle background texture */}
        <div className="absolute inset-0 pointer-events-none opacity-50">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/3 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-accent/3 rounded-full blur-[80px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
