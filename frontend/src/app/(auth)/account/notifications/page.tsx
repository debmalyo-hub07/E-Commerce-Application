"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function NotificationsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    setLoading(false);
    // Ideally we'd fetch from /api/user/notifications here
  }, [session]);

  if (!session) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl mx-auto pb-10 pt-10 px-4"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Notifications</h1>
        <p className="text-muted-foreground mt-1 text-sm">Stay updated with your orders and account.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm p-4 text-center text-muted-foreground">
        <p className="py-8">You have no new notifications.</p>
      </div>
    </motion.div>
  );
}
