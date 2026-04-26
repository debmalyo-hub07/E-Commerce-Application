import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/common/Providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { EnhancedDiscountNotification } from "@/components/layout/EnhancedDiscountNotification";
import { auth } from "@/lib/auth/config";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "StyleMart — Premium E-Commerce Platform",
    template: "%s | StyleMart",
  },
  description:
    "Discover the latest trends in fashion, electronics, and lifestyle with StyleMart. Fast delivery, secure payments, and world-class products.",
  keywords: ["ecommerce", "shopping", "fashion", "electronics", "StyleMart", "India"],
  authors: [{ name: "StyleMart" }],
  creator: "StyleMart",
  metadataBase: new URL(process.env.APP_URL ?? "https://stylemart.in"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: process.env.APP_URL ?? "https://stylemart.in",
    siteName: "StyleMart",
    title: "StyleMart — Premium E-Commerce Platform",
    description: "Discover the latest trends with StyleMart. Fast delivery, secure payments.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "StyleMart",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "StyleMart — Premium E-Commerce Platform",
    description: "Discover the latest trends with StyleMart.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f1a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning className="font-sans antialiased bg-background text-foreground min-h-screen flex flex-col overflow-x-hidden">
        <Providers session={session}>
          {/* Skip to main content for accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:font-medium"
          >
            Skip to main content
          </a>

          <EnhancedDiscountNotification />
          <Navbar />

          {/* Cart Drawer (global, triggered by store) */}
          <CartDrawer />

          {/* Main content */}
          <main id="main-content" className="flex-1">
            {children}
          </main>

          <Footer />
        </Providers>
      </body>
    </html>
  );
}
