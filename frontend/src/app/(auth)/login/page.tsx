import { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./LoginForm";
import { AuthLayout } from "@/components/auth/AuthLayout";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your NexMart account",
};

export default function LoginPage() {
  return (
    <AuthLayout>
      <div className="space-y-8">
        {/* Mobile logo (hidden on desktop where AuthLayout shows it) */}
        <div className="lg:hidden text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-extrabold text-lg tracking-tighter">NM</span>
            </div>
            <span className="font-outfit font-black text-2xl tracking-tight">NexMart</span>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center lg:text-left">
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to access your account, orders, and wishlist
          </p>
        </div>

        {/* Form */}
        <LoginForm />

        {/* Footer link */}
        <div className="text-center text-sm">
          <p className="text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-bold text-primary hover:text-primary/80 transition-colors"
            >
              Sign up today
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
