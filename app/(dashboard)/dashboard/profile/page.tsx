"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { getCroppedImg } from "@/lib/cropImage";
import {
  UserCircle, Lock, DollarSign, Loader2,
  Calendar, MapPin, Phone, Mail, Camera, X,
  ZoomIn, ZoomOut, Check, Monitor, Moon, Sun, Palette,
} from "lucide-react";
import type { SalesRep, Booking } from "@/types";
import { useTheme, type ThemeSetting } from "@/contexts/ThemeContext";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { theme, setTheme } = useTheme();
  const [rep, setRep] = useState<SalesRep | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({ new: "", confirm: "" });
  const [changingPw, setChangingPw] = useState(false);

  // Avatar state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profile } = await supabase
      .from("sales_reps")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (profile) {
      setRep(profile);
      const { data: bks } = await supabase
        .from("sales_bookings")
        .select("*")
        .eq("rep_id", profile.id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });
      setBookings(bks || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function onCropComplete(_: Area, pixels: Area) { setCroppedAreaPixels(pixels); }
  function cancelCrop() { setShowCropper(false); setImageSrc(null); }

  async function saveCroppedAvatar() {
    if (!imageSrc || !croppedAreaPixels || !rep) return;
    setUploading(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");
      const fileName = `${session.user.id}/avatar-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("avatars").upload(fileName, blob, { upsert: true, contentType: "image/jpeg" });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const { error: updateError } = await supabase
        .from("sales_reps").update({ avatar_url: publicUrl }).eq("id", rep.id);
      if (updateError) throw updateError;
      setRep((prev) => prev ? { ...prev, avatar_url: publicUrl } : prev);
      setShowCropper(false);
      setImageSrc(null);
      toast.success("Profile picture updated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload. Check storage is set up.");
    } finally {
      setUploading(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) { toast.error("Passwords don't match"); return; }
    if (passwordForm.new.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setChangingPw(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: passwordForm.new });
    setChangingPw(false);
    if (error) { toast.error(error.message); }
    else { toast.success("Password updated!"); setPasswordForm({ new: "", confirm: "" }); }
  }

  const commissionByMonth = bookings.reduce((acc: Record<string, { total: number; count: number }>, b) => {
    const d = new Date(b.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!acc[key]) acc[key] = { total: 0, count: 0 };
    acc[key].total += b.commission_earned;
    acc[key].count++;
    return acc;
  }, {});

  const monthlyData = Object.entries(commissionByMonth)
    .sort(([a], [b]) => b.localeCompare(a)).slice(0, 12);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={28} className="animate-spin" style={{ color: "#F5A800" }} />
      </div>
    );
  }

  if (!rep) return null;
  const totalCommission = bookings.reduce((s, b) => s + b.commission_earned, 0);

  const THEME_OPTIONS: { value: ThemeSetting; label: string; icon: React.ReactNode }[] = [
    { value: "system", label: "System",  icon: <Monitor size={20} /> },
    { value: "dark",   label: "Dark",    icon: <Moon    size={20} /> },
    { value: "light",  label: "Light",   icon: <Sun     size={20} /> },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto animate-fade-in">
      <h1
        className="text-2xl font-bold mb-6 pt-12 lg:pt-0"
        style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text)" }}
      >
        Profile
      </h1>

      {/* ── AVATAR CROPPER MODAL ── */}
      {showCropper && imageSrc && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.92)" }}>
          <div
            className="flex items-center justify-between px-5 py-4 shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
          >
            <p className="font-semibold" style={{ color: "var(--text)", fontFamily: "'Space Grotesk', sans-serif" }}>
              Adjust your photo
            </p>
            <button onClick={cancelCrop} style={{ color: "var(--text-40)" }}>
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 relative">
            <Cropper
              image={imageSrc} crop={crop} zoom={zoom} aspect={1}
              cropShape="round" showGrid={false}
              onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete}
              style={{
                containerStyle: { background: "#0a0700" },
                cropAreaStyle: { border: "2px solid #F5A800", boxShadow: "0 0 0 9999px rgba(0,0,0,0.7)" },
              }}
            />
          </div>
          <div
            className="shrink-0 px-6 py-5 space-y-4"
            style={{ background: "var(--sidebar-bg)", borderTop: "1px solid var(--border-6)" }}
          >
            <div className="flex items-center gap-3">
              <ZoomOut size={16} style={{ color: "var(--text-40)" }} />
              <input
                type="range" min={1} max={3} step={0.01} value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1" style={{ accentColor: "#F5A800" }}
              />
              <ZoomIn size={16} style={{ color: "var(--text-40)" }} />
              <span className="text-xs w-10 text-right" style={{ color: "var(--text-40)" }}>
                {zoom.toFixed(1)}×
              </span>
            </div>
            <p className="text-xs text-center" style={{ color: "var(--text-30)" }}>
              Drag to reposition · Pinch or use slider to zoom
            </p>
            <div className="flex gap-3">
              <button onClick={cancelCrop} className="btn-ghost flex-1">Cancel</button>
              <button onClick={saveCroppedAvatar} disabled={uploading} className="btn-gold flex-1">
                {uploading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                {uploading ? "Uploading…" : "Save photo"}
              </button>
            </div>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

      {/* Profile card */}
      <div className="glass-card p-6 mb-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative shrink-0">
            <div
              className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center text-2xl font-bold cursor-pointer group"
              style={{ background: "linear-gradient(135deg, #F5A800, #D4920A)" }}
              onClick={() => fileInputRef.current?.click()}
            >
              {rep.avatar_url ? (
                <img src={rep.avatar_url} alt={rep.full_name} className="w-full h-full object-cover" />
              ) : (
                <span style={{ color: "#000" }}>{rep.full_name[0]?.toUpperCase()}</span>
              )}
              <div
                className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "rgba(0,0,0,0.55)" }}
              >
                <Camera size={20} style={{ color: "#fff" }} />
              </div>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #F5A800, #D4920A)", border: "2px solid var(--sidebar-bg)" }}
            >
              <Camera size={13} style={{ color: "#000" }} />
            </button>
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>{rep.full_name}</h2>
            <p className="text-sm" style={{ color: "var(--gold-60)" }}>
              {rep.role === "owner" ? "Owner" : rep.role === "manager" ? "Manager" : "Sales Representative"}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs mt-1 hover:underline"
              style={{ color: "var(--gold-50)" }}
            >
              Change photo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: <Mail size={15} />,     value: rep.email },
            rep.phone  ? { icon: <Phone  size={15} />, value: rep.phone }  : null,
            rep.region ? { icon: <MapPin  size={15} />, value: rep.region } : null,
            { icon: <Calendar size={15} />, value: `Joined ${new Date(rep.created_at).toLocaleDateString()}` },
            { icon: <UserCircle size={15} />, value: rep.role.charAt(0).toUpperCase() + rep.role.slice(1) },
          ].filter(Boolean).map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
              <span style={{ color: "var(--text-30)" }}>{item!.icon}</span>
              <span className="text-sm" style={{ color: "var(--text)" }}>{item!.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── APPEARANCE / THEME ── */}
      <div className="glass-card p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Palette size={16} style={{ color: "#F5A800" }} />
          <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Appearance</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {THEME_OPTIONS.map((opt) => {
            const active = theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border transition-all"
                style={{
                  background: active ? "var(--gold-10)" : "var(--surface-4)",
                  borderColor: active ? "#F5A800" : "var(--border-8)",
                  color: active ? "#F5A800" : "var(--text-40)",
                }}
              >
                {opt.icon}
                <span className="text-xs font-medium">{opt.label}</span>
                {active && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: "var(--gold-15)", color: "#F5A800" }}
                  >
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs mt-3" style={{ color: "var(--text-30)" }}>
          Your choice syncs across all your devices when logged in.
        </p>
      </div>

      {/* Change password */}
      <div className="glass-card p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={16} style={{ color: "#F5A800" }} />
          <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Change Password</h3>
        </div>
        <form onSubmit={changePassword} className="space-y-3">
          <input
            type="password" value={passwordForm.new} placeholder="New password"
            onChange={(e) => setPasswordForm((p) => ({ ...p, new: e.target.value }))}
            className="input-dark" required minLength={6}
          />
          <input
            type="password" value={passwordForm.confirm} placeholder="Confirm new password"
            onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
            className="input-dark" required
          />
          <button type="submit" disabled={changingPw} className="btn-gold">
            {changingPw ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
            Update Password
          </button>
        </form>
      </div>

      {/* Commission history */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign size={16} style={{ color: "#F5A800" }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Commission History</h3>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: "var(--text-35)" }}>Total earned</p>
            <p className="text-lg font-bold" style={{ color: "#F5A800", fontFamily: "'Space Grotesk', sans-serif" }}>
              ₵{totalCommission.toLocaleString()}
            </p>
          </div>
        </div>
        {monthlyData.length === 0 ? (
          <p className="text-sm py-6 text-center" style={{ color: "var(--text-30)" }}>
            No commission history yet
          </p>
        ) : (
          <div className="space-y-2">
            {monthlyData.map(([month, data]) => {
              const [y, m] = month.split("-");
              const label = new Date(parseInt(y), parseInt(m) - 1)
                .toLocaleDateString("en-US", { month: "long", year: "numeric" });
              return (
                <div
                  key={month}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: "var(--surface-2)" }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{label}</p>
                    <p className="text-xs" style={{ color: "var(--text-30)" }}>
                      {data.count} booking{data.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <p className="font-bold" style={{ color: "#F5A800", fontFamily: "'Space Grotesk', sans-serif" }}>
                    ₵{data.total.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
