"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";

export default function CODVerificationPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [verifications, setVerifications] = useState([]);

  useEffect(() => {
    if (!session) return;
    setLoading(false);
    // Ideally we'd fetch from /api/admin/cod-verification here
  }, [session]);

  if (!session) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto pb-10"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">COD Verification</h1>
        <p className="text-muted-foreground mt-1 text-sm">Verify Cash on Delivery payments collected by couriers.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm p-4 text-center text-muted-foreground">
        <p className="py-8">No pending COD verifications found.</p>
      </div>
    </motion.div>
  );
}
