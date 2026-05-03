"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Edit3,
  Save,
  X,
  History,
  ChevronDown,
  UserCog,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "DELETED";
  emailVerified: boolean;
  phone?: string;
  gender?: string;
  dob?: string;
  createdAt: string;
  updatedAt: string;
}

interface HistoryEntry {
  _id: string;
  action: string;
  metadata?: Record<string, { old: unknown; new: unknown }>;
  userId?: string;
  createdAt: string;
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isManaging, setIsManaging] = useState(() => searchParams.get("mode") === "manage");
  const [manageData, setManageData] = useState<{ role?: string; status?: string }>({});
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!session || !params.id) return;

    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/users/${params.id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch user");
        }

        const data = await response.json();
        setUser(data.data);
        setManageData({ role: data.data.role, status: data.data.status });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load user");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [session, params.id]);

  const fetchHistory = async () => {
    if (!params.id) return;
    try {
      setLoadingHistory(true);
      const response = await fetch(`/api/admin/users/${params.id}/history`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data.data || []);
      }
    } catch {
      console.error("Failed to fetch history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const toggleManage = () => {
    if (isManaging) {
      setIsManaging(false);
      if (user) {
        setManageData({ role: user.role, status: user.status });
      }
    } else {
      setIsManaging(true);
    }
  };

  const handleManageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setManageData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
    if (!user || !params.id) return;

    const submitData: Record<string, string> = {};
    if (manageData.role !== user.role) submitData.role = manageData.role!;
    if (manageData.status !== user.status) submitData.status = manageData.status!;

    if (Object.keys(submitData).length === 0) {
      setIsManaging(false);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to save changes");
      }

      const data = await response.json();
      setUser((prev) => (prev ? { ...prev, ...data.data } : null));
      setIsManaging(false);
      if (submitData.role || submitData.status) {
        fetchHistory();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const toggleHistory = () => {
    if (!showHistory) {
      fetchHistory();
    }
    setShowHistory(!showHistory);
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "USER_PROFILE_UPDATED":
        return "Profile Update";
      case "USER_UPDATED":
        return "Admin Action";
      case "USER_DELETED":
        return "Account Deleted";
      case "USER_CREATED":
        return "Account Created";
      default:
        return action;
    }
  };

  const formatChange = (
    field: string,
    change: { old: unknown; new: unknown }
  ) => {
    const fieldLabels: Record<string, string> = {
      name: "Display Name",
      phone: "Phone",
      gender: "Gender",
      dob: "Date of Birth",
      role: "Role",
      status: "Status",
    };
    const label = fieldLabels[field] || field;
    const oldVal =
      field === "dob"
        ? change.old
          ? new Date(change.old as string).toLocaleDateString()
          : "Not set"
        : String(change.old ?? "Not set");
    const newVal =
      field === "dob"
        ? change.new
          ? new Date(change.new as string).toLocaleDateString()
          : "Not set"
        : String(change.new ?? "Not set");
    return { label, oldVal, newVal };
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to access admin panel.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "User not found"}</p>
          <Link href="/admin/users" className="text-blue-600 hover:underline">
            Back to Users
          </Link>
        </div>
      </div>
    );
  }

  const isSelf = session.user.id === user._id;

  return (
    <div className="space-y-6 relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 z-0" />

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/users"
            className="p-2 rounded-xl hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{user.name}</h1>
            <p className="text-muted-foreground text-sm mt-1">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={toggleHistory}
            className="rounded-xl"
          >
            <History className="w-4 h-4 mr-2" />
            {showHistory ? "Hide History" : "View History"}
          </Button>
          {!isManaging ? (
            <Button onClick={toggleManage} className="rounded-xl">
              <UserCog className="w-4 h-4 mr-2" />
              Manage
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={toggleManage}
                className="rounded-xl"
                disabled={saving}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSaveChanges}
                className="rounded-xl"
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-muted/30">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <History className="w-5 h-5" />
                  User Activity History
                </h2>
              </div>

              {loadingHistory ? (
                <div className="p-8 text-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-muted-foreground text-sm mt-2">
                    Loading history...
                  </p>
                </div>
              ) : history.length === 0 ? (
                <div className="p-8 text-center">
                  <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No activity recorded yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border max-h-96 overflow-y-auto">
                  {history.map((entry) => (
                    <div key={entry._id} className="px-6 py-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                            {getActionLabel(entry.action)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {entry.action === "USER_PROFILE_UPDATED"
                              ? "by User"
                              : "by Admin"}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {entry.metadata &&
                        Object.entries(entry.metadata).map(([field, change]) => {
                          const { label, oldVal, newVal } = formatChange(
                            field,
                            change as { old: unknown; new: unknown }
                          );
                          return (
                            <div
                              key={field}
                              className="mt-2 flex items-center gap-2 text-sm"
                            >
                              <span className="text-muted-foreground font-medium min-w-[100px]">
                                {label}:
                              </span>
                              <span className="text-red-600 line-through">
                                {oldVal}
                              </span>
                              <span className="text-muted-foreground">→</span>
                              <span className="text-green-600 font-medium">
                                {newVal}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-card rounded-2xl shadow-lg border border-border relative z-10 overflow-hidden">
        <div className="px-6 py-6 border-b border-border bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xl">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
                {user.role === "ADMIN" && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-bold bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Admin
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          {isManaging ? (
            <div className="space-y-6">
              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Edit3 className="w-5 h-5" />
                  User Management
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Only role and account status can be modified by admins.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Role
                    </label>
                    <select
                      name="role"
                      value={manageData.role || "CUSTOMER"}
                      onChange={handleManageChange}
                      disabled={isSelf}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="CUSTOMER">Customer</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    {isSelf && (
                      <p className="text-xs text-muted-foreground mt-1">
                        You cannot modify your own role
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Account Status
                    </label>
                    <select
                      name="status"
                      value={manageData.status || "ACTIVE"}
                      onChange={handleManageChange}
                      disabled={isSelf}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="SUSPENDED">Suspended</option>
                    </select>
                    {isSelf && (
                      <p className="text-xs text-muted-foreground mt-1">
                        You cannot modify your own status
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Account Information
                  </h3>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-semibold text-foreground">{user.email}</p>
                    </div>
                    {user.emailVerified ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 ml-auto" />
                    )}
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Role</p>
                      <p className="font-semibold text-foreground capitalize">
                        {user.role.toLowerCase()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="font-semibold text-foreground capitalize">
                        {user.status.toLowerCase()}
                      </p>
                    </div>
                    <span
                      className={`ml-auto w-2 h-2 rounded-full ${
                        user.status === "ACTIVE"
                          ? "bg-green-500"
                          : user.status === "SUSPENDED"
                          ? "bg-yellow-500"
                          : "bg-gray-500"
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Profile Details
                  </h3>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-semibold text-foreground">
                        {user.phone ? `+91 ${user.phone}` : "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Gender</p>
                      <p className="font-semibold text-foreground">
                        {user.gender
                          ? user.gender.replace(/_/g, " ").toLowerCase()
                              .replace(/\b\w/g, (c) => c.toUpperCase())
                          : "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Date of Birth</p>
                      <p className="font-semibold text-foreground">
                        {user.dob
                          ? new Date(user.dob).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">User ID</p>
                    <p className="font-mono text-xs text-foreground mt-1 truncate">
                      {user._id}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Member Since</p>
                    <p className="font-semibold text-foreground mt-1">
                      {new Date(user.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email Verification</p>
                    <p className="font-semibold text-foreground mt-1">
                      {user.emailVerified ? "Verified" : "Not Verified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p className="font-semibold text-foreground mt-1">
                      {new Date(user.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}