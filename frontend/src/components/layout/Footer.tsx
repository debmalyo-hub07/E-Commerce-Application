"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, ArrowRight, Sparkles } from "lucide-react";

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
    { label: "Toys & Baby", href: "/products?category=toys-baby" },
  ],
};

const paymentIcons = ["Visa", "Mastercard", "UPI", "Razorpay", "COD"];

export function Footer() {
  return (
    <footer className="relative bg-card border-t border-border mt-auto overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-accent/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Newsletter Bar */}
      <div className="relative bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center gap-8 justify-between"
          >
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-primary font-bold text-sm tracking-widest uppercase">Newsletter</span>
              </div>
              <h3 className="text-2xl font-black tracking-tight mb-1">Join 1M+ StyleMart Members</h3>
              <p className="text-sm text-muted-foreground">
                Get exclusive deals, new arrivals, and personalized offers.
              </p>
            </div>
            <form
              className="flex gap-3 w-full md:w-auto"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="relative flex-1 md:w-80">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full pl-11 pr-4 py-3.5 text-sm bg-background/80 backdrop-blur-md border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all duration-300 hover:border-primary/30"
                  aria-label="Email for newsletter"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                className="group px-7 py-3.5 bg-gradient-to-r from-primary to-indigo-600 text-primary-foreground text-sm font-bold rounded-2xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 flex items-center gap-2 flex-shrink-0"
              >
                Subscribe <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-5 group">
              <motion.div 
                whileHover={{ rotate: [0, -10, 10, 0] }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/20"
              >
                <span className="text-white font-extrabold text-lg tracking-tighter">SM</span>
              </motion.div>
              <span className="font-outfit font-black text-2xl tracking-tight">StyleMart</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              India&apos;s premium e-commerce platform for fashion, electronics, and lifestyle products.
            </p>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-3 group hover:text-primary transition-colors">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                </div>
                <span>1800-STYLE-MRT (toll-free)</span>
              </div>
              <div className="flex items-center gap-3 group hover:text-primary transition-colors">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                </div>
                <a href="mailto:support@stylemart.in" className="hover:text-primary transition-colors">
                  support@stylemart.in
                </a>
              </div>
              <div className="flex items-center gap-3 group hover:text-primary transition-colors">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                </div>
                <span>Bangalore, Karnataka, India</span>
              </div>
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
              <h4 className="font-bold text-sm mb-5 text-foreground tracking-wide">{title}</h4>
              <ul className="space-y-3">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-muted-foreground hover:text-primary hover:translate-x-1 transition-all duration-200 inline-block"
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

      {/* Bottom Bar */}
      <div className="relative border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-7">
          <div className="flex flex-col sm:flex-row items-center gap-5 justify-between">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} StyleMart. All rights reserved.
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
                  className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 hover:shadow-md hover:shadow-primary/10 transition-all duration-300"
                >
                  <Icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>

            {/* Payment badges */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground mr-1">Secured by:</span>
              {paymentIcons.map((name) => (
                <span
                  key={name}
                  className="px-2.5 py-1 bg-muted/50 text-muted-foreground text-[10px] font-bold rounded-lg border border-border/50 hover:border-primary/30 hover:text-primary transition-colors duration-200"
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
