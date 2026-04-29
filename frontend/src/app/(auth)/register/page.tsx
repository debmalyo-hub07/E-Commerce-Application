import { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./RegisterForm";
import { AuthLayout } from "@/components/auth/AuthLayout";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your NexMart account",
};

export default function RegisterPage() {
  return (
    <AuthLayout>
      <div className="space-y-8">
        {/* Mobile logo */}
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
            Create an account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Join NexMart and start shopping seamlessly
          </p>
        </div>

        {/* Form */}
        <RegisterForm />

        {/* Footer link */}
        <div className="text-center text-sm">
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-primary hover:text-primary/80 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
