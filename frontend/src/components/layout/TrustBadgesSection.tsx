"use client";

import { motion } from "framer-motion";
import { Truck, Shield, RefreshCw, Zap } from "lucide-react";

interface TrustBadgeProps {
  icon: React.ElementType;
  title: string;
  desc: string;
  index: number;
}

function TrustBadge({ icon: Icon, title, desc, index }: TrustBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 300, damping: 24 }}
      viewport={{ once: true }}
      className="group relative overflow-hidden"
    >
      <div className="relative h-full bg-gradient-to-br from-card via-card to-card/50 backdrop-blur-sm border border-border/40 rounded-3xl overflow-hidden transition-all duration-500 hover:border-primary/60 hover:shadow-[0_20px_40px_-10px_var(--color-primary-shadow)]">
        {/* Animated background gradient on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
        />

        {/* Glow effect */}
        <motion.div
          className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/5 rounded-3xl opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-500"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Content */}
        <div className="relative z-10 p-6 sm:p-8 flex flex-col items-center sm:flex-row sm:items-center gap-4 sm:gap-6 h-full">
          {/* Icon Container */}
          <motion.div
            className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-lg shadow-primary/10 border border-primary/20 group-hover:from-primary/30 group-hover:to-primary/15 transition-all duration-500 relative"
            whileHover={{
              scale: 1.15,
              rotateZ: 8,
            }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Icon glow pulse */}
            <motion.div
              className="absolute inset-0 rounded-3xl bg-primary/20 blur-lg opacity-0 group-hover:opacity-100"
              animate={{
                scale: [1, 1.3, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary relative z-10 transition-transform duration-300 group-hover:scale-110" />
          </motion.div>

          {/* Text Content */}
          <div className="flex-1 text-center sm:text-left">
            <motion.p
              className="text-sm sm:text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors duration-300"
              whileHover={{ x: 4 }}
            >
              {title}
            </motion.p>
            <motion.p
              className="text-xs sm:text-sm text-muted-foreground mt-1 group-hover:text-muted-foreground/80 transition-colors duration-300"
              whileHover={{ x: 4 }}
            >
              {desc}
            </motion.p>
          </div>

          {/* Animated line on hover */}
          <motion.div
            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary via-primary to-transparent opacity-0 group-hover:opacity-100"
            animate={{
              scaleX: [0, 1, 0],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export function TrustBadgesSection() {
  const trustBadges = [
    {
      icon: Truck,
      title: "Free Delivery",
      desc: "On orders above ₹1,000",
    },
    {
      icon: Shield,
      title: "Secure Payments",
      desc: "100% safe & encrypted",
    },
    {
      icon: RefreshCw,
      title: "Easy Returns",
      desc: "7-day return policy",
    },
    {
      icon: Zap,
      title: "Fast Shipping",
      desc: "1–3 business days",
    },
  ];

  return (
    <section className="w-full bg-gradient-to-b from-background via-background/50 to-background/80 py-12 sm:py-16 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <motion.span
            className="inline-block text-primary font-bold tracking-widest text-xs sm:text-sm uppercase mb-3 bg-primary/10 px-4 py-2 rounded-full"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Why Choose Us
          </motion.span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mt-4">
            Premium Shopping Experience
          </h2>
        </motion.div>

        {/* Trust Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {trustBadges.map((badge, index) => (
            <TrustBadge key={badge.title} {...badge} index={index} />
          ))}
        </div>

        {/* Divider */}
        <motion.div
          className="mt-12 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        />
      </div>
    </section>
  );
}
