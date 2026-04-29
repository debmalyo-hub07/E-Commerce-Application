"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { ShieldCheck, Loader2, ArrowRight, Server, Key, MailCheck } from "lucide-react";
import { signIn } from "next-auth/react";
import { AuthLayout } from "@/components/auth/AuthLayout";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeInput, setActiveInput] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      router.push("/register");
    }
  }, [email, router]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      setActiveInput(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        // Move to previous input on backspace if current is empty
        setActiveInput(index - 1);
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6).split("");
    if (pastedData.some(char => !/^\d$/.test(char))) return;

    const newOtp = [...otp];
    pastedData.forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });
    setOtp(newOtp);

    // Focus last filled or next empty
    const focusIndex = Math.min(pastedData.length, 5);
    setActiveInput(focusIndex);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleVerify = async () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpValue }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || "Verification failed");
      }

      toast.success("Email verified successfully!", { icon: "✅" });

      // Attempt auto-login if password is in sessionStorage
      const tempPwd = sessionStorage.getItem("temp_reg_pwd");
      if (tempPwd) {
        const result = await signIn("credentials", {
          redirect: false,
          email,
          password: tempPwd,
        });

        sessionStorage.removeItem("temp_reg_pwd"); // Clean up

        if (result?.error) {
          router.push("/login");
        } else {
          router.push("/");
          router.refresh();
        }
      } else {
        router.push("/login?verified=true");
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center lg:text-left">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="w-16 h-16 mb-5 bg-primary/10 rounded-2xl flex items-center justify-center relative mx-auto lg:mx-0"
        >
          <div className="absolute inset-0 bg-primary/15 rounded-2xl animate-ping opacity-50"></div>
          <ShieldCheck className="w-8 h-8 text-primary z-10 relative" />
        </motion.div>

        <h1 className="text-3xl font-black tracking-tight text-foreground mb-2">
          Secure Verification
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We&apos;ve sent a 6-digit code to{" "}
          <strong className="text-foreground">{email}</strong>
        </p>
      </div>

      {/* Server Connection Badge */}
      <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground bg-muted/50 px-4 py-2.5 rounded-xl border border-border">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
          <Server className="w-4 h-4 text-primary" />
        </motion.div>
        <span>Establishing secure connection...</span>
        <motion.div 
          animate={{ opacity: [0.2, 1, 0.2] }} 
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Key className="w-4 h-4 text-emerald-500" />
        </motion.div>
      </div>

      {/* OTP Inputs */}
      <div className="flex justify-center gap-2 sm:gap-3 w-full">
        {otp.map((digit, index) => (
          <motion.input
            key={index}
            ref={el => { inputRefs.current[index] = el; }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.08 }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => setActiveInput(index)}
            className={`w-12 h-14 text-center text-2xl font-bold bg-background border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-0 ${
              activeInput === index 
                ? "border-primary shadow-[0_0_15px_rgba(99,102,241,0.3)] scale-110 z-10" 
                : digit 
                  ? "border-primary/50 text-foreground" 
                  : "border-border text-transparent"
            }`}
          />
        ))}
      </div>

      {/* Verify Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleVerify}
        disabled={isLoading || otp.join("").length !== 6}
        className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg overflow-hidden relative group"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <span className="relative z-10 flex items-center gap-2">
              Verify Identity <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
          </>
        )}
      </motion.button>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <AuthLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center space-x-2 animate-pulse py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="text-xl font-bold text-primary tracking-widest">VERIFYING...</span>
        </div>
      }>
        <VerifyContent />
      </Suspense>
    </AuthLayout>
  );
}
