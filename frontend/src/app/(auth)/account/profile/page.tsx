"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Mail, Phone, Calendar, Edit3, Settings, Camera, User, Lock, ChevronRight, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const [profile, setProfile] = useState<{ name: string; phone: string; createdAt: string; gender?: string; dob?: string; avatarUrl?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Independent edit states
  const [editingField, setEditingField] = useState<"name" | "phone" | "gender" | "dob" | null>(null);
  const [formData, setFormData] = useState({ name: "", phone: "", gender: "", dob: "" });
  const [savingField, setSavingField] = useState<"name" | "phone" | "gender" | "dob" | null>(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "" });
  const [passwordStatus, setPasswordStatus] = useState({ loading: false, error: "", success: "" });

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      if (res.ok && data.data) {
        setProfile(data.data);
        setFormData({ 
          name: data.data.name, 
          phone: data.data.phone || "",
          gender: data.data.gender || "",
          dob: data.data.dob ? new Date(data.data.dob).toISOString().split('T')[0] : ""
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveField = async (field: "name" | "phone" | "gender" | "dob") => {
    setSavingField(field);
    try {
      const payload = { [field]: formData[field] };
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data.data);
        setEditingField(null);
        if (field === "name") {
          update({ name: formData.name }); // Update session name
        }
      } else {
        alert(data.error || "Failed to update profile");
      }
    } catch (err) {
      alert("An error occurred");
    } finally {
      setSavingField(null);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/user/profile/avatar", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (res.ok && data.data?.avatarUrl) {
        setProfile(prev => prev ? { ...prev, avatarUrl: data.data.avatarUrl } : null);
        update({ image: data.data.avatarUrl }); // Update session image
      } else {
        alert(data.error || "Failed to upload avatar");
      }
    } catch (err) {
      console.error("Upload error", err);
      alert("An error occurred during upload");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus({ loading: true, error: "", success: "" });
    try {
      const res = await fetch("/api/user/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordData),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordStatus({ loading: false, error: "", success: "Password updated successfully!" });
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordData({ currentPassword: "", newPassword: "" });
          setPasswordStatus({ loading: false, error: "", success: "" });
        }, 2000);
      } else {
        setPasswordStatus({ loading: false, error: data.error || "Failed to update password", success: "" });
      }
    } catch (err) {
      setPasswordStatus({ loading: false, error: "An error occurred", success: "" });
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session || !profile) return null;

  const currentAvatar = profile.avatarUrl || session.user?.image;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 max-w-5xl mx-auto"
    >
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your personal information and security preferences.</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden relative">
        <div className="h-32 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent absolute top-0 left-0 right-0 z-0"></div>

        <div className="p-8 relative z-10">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center border-b border-border/50 pb-8 mb-8">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleAvatarUpload} 
              />
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-primary/80 border-4 border-background shadow-xl flex items-center justify-center text-5xl font-bold text-primary-foreground overflow-hidden relative">
                {uploadingAvatar ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : currentAvatar ? (
                  <Image src={currentAvatar} alt={profile.name} fill className="object-cover" />
                ) : (
                  profile.name?.[0]?.toUpperCase() || "U"
                )}
                
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
            </motion.div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-4">
                {editingField === "name" ? (
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="bg-background border border-primary/50 rounded-lg px-3 py-1.5 outline-none text-foreground text-2xl font-bold w-64 focus:ring-2 focus:ring-primary/20"
                      autoFocus
                    />
                    <Button size="sm" onClick={() => handleSaveField("name")} disabled={savingField === "name"}>
                      {savingField === "name" ? "Saving..." : "Save"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEditingField(null); setFormData({...formData, name: profile.name}); }}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
                    {profile.name}
                    {session.user?.role === "ADMIN" && (
                      <span className="bg-primary/10 text-primary text-xs px-3 py-1 rounded-full flex items-center gap-1.5 font-medium border border-primary/20 shadow-sm">
                        <ShieldCheck className="w-3.5 h-3.5" /> Admin
                      </span>
                    )}
                    <button onClick={() => setEditingField("name")} className="text-muted-foreground hover:text-primary transition-colors ml-2 p-1 rounded-md hover:bg-primary/10">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </h2>
                )}
              </div>
              <p className="text-muted-foreground flex items-center gap-2 font-medium">
                <Mail className="w-4 h-4" /> {session.user?.email}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <motion.div className="space-y-6">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <User className="w-4 h-4" /> Personal Details
              </h3>
              
              <div className="space-y-5">
                <div className="group p-4 rounded-xl border border-border/50 bg-card hover:bg-accent/50 hover:border-primary/20 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Mobile Number</p>
                      {editingField === "phone" ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input 
                            type="tel" 
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            placeholder="10-digit number" 
                            className="w-full text-sm font-medium text-foreground bg-background border border-primary/50 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20" 
                            autoFocus
                          />
                          <Button size="sm" onClick={() => handleSaveField("phone")} disabled={savingField === "phone"}>
                            {savingField === "phone" ? "..." : "Save"}
                          </Button>
                          <Button size="sm" variant="ghost" className="px-2" onClick={() => { setEditingField(null); setFormData({...formData, phone: profile.phone || ""}); }}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <p className="font-semibold text-foreground">
                            {profile.phone ? `+91 ${profile.phone}` : <span className="italic opacity-80 text-muted-foreground">Add mobile number</span>}
                          </p>
                          <button onClick={() => setEditingField("phone")} className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-primary/10">
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="group p-4 rounded-xl border border-border/50 bg-card hover:bg-accent/50 hover:border-primary/20 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Gender</p>
                      {editingField === "gender" ? (
                        <div className="flex items-center gap-2 mt-1">
                          <select 
                            value={formData.gender}
                            onChange={(e) => setFormData({...formData, gender: e.target.value})}
                            className="w-full text-sm font-medium text-foreground bg-background border border-primary/50 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            autoFocus
                          >
                            <option value="">Select Gender</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                            <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                          </select>
                          <Button size="sm" onClick={() => handleSaveField("gender")} disabled={savingField === "gender"}>
                            {savingField === "gender" ? "..." : "Save"}
                          </Button>
                          <Button size="sm" variant="ghost" className="px-2" onClick={() => { setEditingField(null); setFormData({...formData, gender: profile.gender || ""}); }}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <p className="font-semibold text-foreground capitalize">
                            {profile.gender ? profile.gender.toLowerCase().replace(/_/g, ' ') : <span className="italic opacity-80 text-muted-foreground">Add gender</span>}
                          </p>
                          <button onClick={() => setEditingField("gender")} className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-primary/10">
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="group p-4 rounded-xl border border-border/50 bg-card hover:bg-accent/50 hover:border-primary/20 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Date of Birth</p>
                      {editingField === "dob" ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input 
                            type="date" 
                            value={formData.dob}
                            onChange={(e) => setFormData({...formData, dob: e.target.value})}
                            className="w-full text-sm font-medium text-foreground bg-background border border-primary/50 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20" 
                            autoFocus
                          />
                          <Button size="sm" onClick={() => handleSaveField("dob")} disabled={savingField === "dob"}>
                            {savingField === "dob" ? "..." : "Save"}
                          </Button>
                          <Button size="sm" variant="ghost" className="px-2" onClick={() => { setEditingField(null); setFormData({...formData, dob: profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : ""}); }}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <p className="font-semibold text-foreground">
                            {profile.dob ? new Date(profile.dob).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : <span className="italic opacity-80 text-muted-foreground">Add date of birth</span>}
                          </p>
                          <button onClick={() => setEditingField("dob")} className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-primary/10">
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>

            <motion.div className="space-y-6">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Account Security
              </h3>
              
              <div className="space-y-5">
                <div className="group p-4 rounded-xl border border-border/50 bg-card hover:bg-accent/50 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Account Status</p>
                      <p className="font-semibold text-green-600 flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                        </span>
                        Verified & Active
                      </p>
                    </div>
                  </div>
                </div>

                <div className="group p-4 rounded-xl border border-border/50 bg-card hover:bg-accent/50 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Member Since</p>
                      <p className="font-semibold text-foreground">
                        {new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <motion.div 
          onClick={() => setShowPasswordModal(true)}
          whileHover={{ y: -4, scale: 1.01 }}
          className="bg-card p-6 rounded-2xl shadow-sm border border-border cursor-pointer group flex items-center justify-between overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-primary/10"></div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 transition-shadow">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">Change Password</h4>
              <p className="text-sm text-muted-foreground mt-0.5">Update your security credentials</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors relative z-10" />
        </motion.div>
        
        <motion.div 
          onClick={() => setShowPrivacyModal(true)}
          whileHover={{ y: -4, scale: 1.01 }}
          className="bg-card p-6 rounded-2xl shadow-sm border border-border cursor-pointer group flex items-center justify-between overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-purple-500/10"></div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 transition-shadow">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-foreground text-lg group-hover:text-purple-500 transition-colors">Privacy Preferences</h4>
              <p className="text-sm text-muted-foreground mt-0.5">Manage notifications and data</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors relative z-10" />
        </motion.div>
      </div>

      <AnimatePresence>
        {showPasswordModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-border">
                <h3 className="text-xl font-bold text-foreground">Change Password</h3>
                <button onClick={() => setShowPasswordModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                {passwordStatus.error && <p className="text-red-500 text-sm bg-red-500/10 p-3 rounded-lg">{passwordStatus.error}</p>}
                {passwordStatus.success && <p className="text-green-500 text-sm bg-green-500/10 p-3 rounded-lg">{passwordStatus.success}</p>}
                
                <div>
                  <label className="block text-sm font-semibold text-foreground/80 mb-2">Current Password</label>
                  <input 
                    type="password" 
                    required 
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground/80 mb-2">New Password</label>
                  <input 
                    type="password" 
                    required 
                    minLength={8}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-foreground"
                  />
                </div>
                <div className="pt-4">
                  <Button type="submit" className="w-full rounded-xl" disabled={passwordStatus.loading}>
                    {passwordStatus.loading ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showPrivacyModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-border">
                <h3 className="text-xl font-bold text-foreground">Privacy Preferences</h3>
                <button onClick={() => setShowPrivacyModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground">Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">Receive order updates and promotions</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground">SMS Notifications</h4>
                    <p className="text-sm text-muted-foreground">Receive delivery alerts on your phone</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary" />
                </div>
                <div className="pt-4">
                  <Button onClick={() => setShowPrivacyModal(false)} className="w-full rounded-xl">
                    Save Preferences
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
