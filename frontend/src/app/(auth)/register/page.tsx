import { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./RegisterForm";
import { Package } from "lucide-react";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your StyleMart account",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-muted/50">
      <div className="max-w-md w-full space-y-8 bg-card p-8 rounded-2xl shadow-xl border border-border">
        <div className="text-center">
          <Link href="/" className="inline-flex justify-center items-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
            <Package className="w-6 h-6 text-primary" />
          </Link>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Create an account
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Join us to start shopping seamlessly
          </p>
        </div>

        <RegisterForm />

        <div className="mt-6 text-center text-sm">
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
