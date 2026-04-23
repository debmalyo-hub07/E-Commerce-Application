import { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Panel",
  robots: { index: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/");
  }

  const navLinks = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/users", label: "Customers" },
    { href: "/admin/coupons", label: "Coupons" },
    { href: "/admin/refunds", label: "Refunds" },
  ];

  if (session.user.role === "SUPER_ADMIN") {
    navLinks.push({ href: "/admin/cod-verification", label: "COD Verify" });
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-card border-r border-border flex-shrink-0">
        <div className="flex items-center gap-2 px-4 py-5 border-b border-border">
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-bold text-sm">Admin Panel</span>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="block px-3 py-2.5 text-sm font-medium rounded-xl hover:bg-primary/5 hover:text-primary transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              {session.user.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-semibold truncate">{session.user.name}</p>
              <p className="text-[10px] text-primary font-medium">{session.user.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 flex">
        {navLinks.slice(0, 5).map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="flex-1 text-center py-3 text-[10px] font-medium hover:text-primary transition-colors"
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background pb-16 lg:pb-0">
        {children}
      </main>
    </div>
  );
}
