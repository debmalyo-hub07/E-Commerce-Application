"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, ArrowRight, Sparkles, Heart } from "lucide-react";

const footerLinks = {
  company: [
    { label: "About Us", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Blog", href: "/blog" },
    { label: "Press", href: "/press" },
  ],
  support: [
    { label: "Help Center", href: "/help" },
    { label: "Track Order", href: "/account/orders" },
    { label: "Returns & Refunds", href: "/returns" },
    { label: "Contact Us", href: "/contact" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "Accessibility", href: "/accessibility" },
  ],
  categories: [
    { label: "Electronics", href: "/products?category=electronics" },
    { label: "Fashion", href: "/products?category=fashion" },
    { label: "Home & Kitchen", href: "/products?category=home-kitchen" },
    { label: "Beauty & Health", href: "/products?category=beauty-health" },
    { label: "Sports & Fitness", href: "/products?category=sports-fitness" },
    { label: "Books & Media", href: "/products?category=books" },
  ],
};

const paymentIcons = ["Visa", "Mastercard", "UPI", "Razorpay", "COD"];

export function Footer() {
  return (
    <footer className="relative mt-auto overflow-hidden dark-section">
      {/* ── Ambient background effects ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-indigo-500/8 via-purple-500/5 to-transparent rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 left-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 right-1/4 w-[250px] h-[250px] bg-purple-500/5 rounded-full blur-[60px]" />
        <div className="absolute inset-0 dot-pattern opacity-20" />
      </div>

      {/* ── Newsletter Section ── */}
      <div className="relative border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col lg:flex-row items-center gap-10 justify-between"
          >
            <div className="text-center lg:text-left max-w-lg">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-4">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white/80 tracking-widest uppercase">Newsletter</span>
              </div>
              <h3 className="font-outfit text-3xl sm:text-4xl font-black tracking-tight text-white mb-3">
                Join 1M+ <span className="text-gradient-primary">NexMart</span> Members
              </h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Get exclusive deals, early access to new arrivals, and personalized offers delivered to your inbox.
              </p>
            </div>
            <form
              className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="relative flex-1 sm:w-80">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full pl-11 pr-4 py-4 text-sm bg-white/[0.05] backdrop-blur-md border border-white/[0.08] rounded-2xl text-white placeholder:text-white/30 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 outline-none transition-all duration-300 hover:border-white/15 hover:bg-white/[0.07]"
                  aria-label="Email for newsletter"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                className="group px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-bold rounded-2xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 flex items-center justify-center gap-2 flex-shrink-0"
              >
                Subscribe <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>

      {/* ── Main Footer Grid ── */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10 lg:gap-8">
          {/* Brand Column */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-6 group">
              <motion.div
                whileHover={{ rotate: [0, -10, 10, 0] }}
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20"
              >
                <span className="text-white font-extrabold text-lg tracking-tighter">NM</span>
              </motion.div>
              <span className="font-outfit font-black text-2xl tracking-tight text-white">NexMart</span>
            </Link>
            <p className="text-sm text-white/40 mb-6 leading-relaxed max-w-xs">
              India&apos;s premium e-commerce platform for fashion, electronics, and lifestyle products.
            </p>
            <div className="space-y-3">
              {[
                { icon: Phone, text: "1800-NEX-MART", href: "tel:1800639-6278" },
                { icon: Mail, text: "support@nexmart.in", href: "mailto:support@nexmart.in" },
                { icon: MapPin, text: "Bangalore, India", href: "#" },
              ].map(({ icon: Icon, text, href }) => (
                <a
                  key={text}
                  href={href}
                  className="flex items-center gap-3 group text-white/40 hover:text-white transition-colors duration-300"
                >
                  <div className="w-8 h-8 rounded-lg glass-card flex items-center justify-center flex-shrink-0 group-hover:bg-white/[0.08] transition-colors">
                    <Icon className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <span className="text-sm">{text}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Link Groups */}
          {[
            { title: "Categories", links: footerLinks.categories },
            { title: "Company", links: footerLinks.company },
            { title: "Support", links: footerLinks.support },
            { title: "Legal", links: footerLinks.legal },
          ].map(({ title, links }) => (
            <div key={title}>
              <h4 className="font-bold text-sm mb-5 text-white/80 tracking-wide">{title}</h4>
              <ul className="space-y-3">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-white/35 hover:text-white hover:translate-x-1 transition-all duration-300 inline-block"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="relative border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 justify-between">
            <p className="text-sm text-white/30 flex items-center gap-1.5">
              © {new Date().getFullYear()} NexMart. Made with
              <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400 inline-block" />
              in India
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-2">
              {[
                { icon: Facebook, href: "#", label: "Facebook" },
                { icon: Twitter, href: "#", label: "Twitter" },
                { icon: Instagram, href: "#", label: "Instagram" },
                { icon: Youtube, href: "#", label: "YouTube" },
              ].map(({ icon: Icon, href, label }) => (
                <motion.a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.15, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-9 h-9 rounded-xl glass-card flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.08] transition-all duration-300"
                >
                  <Icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>

            {/* Payment badges */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/25 mr-1">Secured by</span>
              {paymentIcons.map((name) => (
                <span
                  key={name}
                  className="px-2.5 py-1 glass-card text-white/40 text-[10px] font-bold rounded-lg hover:text-white/60 hover:bg-white/[0.06] transition-colors duration-200"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
