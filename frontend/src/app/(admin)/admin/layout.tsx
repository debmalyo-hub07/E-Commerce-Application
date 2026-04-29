"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Ticket, 
  RotateCcw, 
  Star,
  LogOut,
  ChevronRight,
  ShieldCheck
} from "lucide-react";

const adminLinks = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Coupons", href: "/admin/coupons", icon: Ticket },
  { name: "Refunds", href: "/admin/refunds", icon: RotateCcw },
  { name: "Reviews", href: "/admin/reviews", icon: Star },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-muted/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Admin Sidebar */}
        <div className="w-full md:w-72 flex-shrink-0">
          <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden sticky top-24">
            
            {/* Admin Header */}
            <div className="p-6 border-b border-border bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-blue-100 font-medium tracking-wider uppercase">NexMart Admin</p>
                  <p className="text-base font-bold text-white truncate max-w-[160px]">
                    {session?.user?.name || "Administrator"}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="p-3 space-y-1 bg-card">
              {adminLinks.map((link) => {
                const isActive = pathname.startsWith(link.href);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                      isActive 
                        ? "text-white font-semibold shadow-md" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-90 z-0" />
                    )}
                    {!isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity z-0" />
                    )}
                    
                    <div className="flex items-center gap-3 relative z-10">
                      <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-white" : "group-hover:text-primary"}`} />
                      <span>{link.name}</span>
                    </div>
                    {isActive && (
                      <motion.div layoutId="adminTabIndicator" className="w-1.5 h-1.5 rounded-full bg-white relative z-10 shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                    )}
                    {!isActive && <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity relative z-10" />}
                  </Link>
                );
              })}
            </nav>

            <div className="p-3 border-t border-border bg-card">
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:text-white rounded-xl transition-all duration-300 font-medium group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-0" />
                <LogOut className="w-5 h-5 relative z-10 group-hover:animate-pulse" />
                <span className="relative z-10">Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Admin Content Area */}
        <div className="flex-1 min-w-0">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
