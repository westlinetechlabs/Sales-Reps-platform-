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
  BookOpen, ChevronDown, ChevronUp, Award, Target,
  Wallet as WalletIcon, Lightbulb, HelpCircle,
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
  const [openSection, setOpenSection] = useState<string | null>(null);

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
        className="text-2xl font-bold mb-6"
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

      {/* ── Platform Manual ── */}
      <div id="platform-manual" className="mt-2">
        <div className="glass-card p-5 mb-4" style={{ borderColor: "var(--gold-15)" }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--gold-10)", border: "1px solid var(--gold-20)" }}>
              <BookOpen size={18} style={{ color: "#F5A800" }} />
            </div>
            <div>
              <p className="font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text)", fontSize: 17 }}>
                Platform Manual
              </p>
              <p className="text-xs" style={{ color: "var(--text-40)" }}>
                Everything you need to know about using Westline Techlabs Sales Portal
              </p>
            </div>
          </div>
        </div>

        {[
          {
            id: "welcome",
            icon: <Award size={16} />,
            title: "Your Role as a Sales Representative",
            color: "#F5A800",
            content: (
              <div className="space-y-3 text-sm" style={{ color: "var(--text-60)", lineHeight: 1.7 }}>
                <p>Welcome to the Westline Techlabs Sales Team. As a Sales Representative, your job is to connect potential clients with our services — from Logo &amp; Branding to Web Development, Mobile Apps, Signage, and more.</p>
                <p><strong style={{ color: "var(--text)" }}>Your responsibilities:</strong></p>
                <ul className="space-y-1 pl-4" style={{ listStyleType: "disc" }}>
                  <li>Find and approach potential clients who need our services</li>
                  <li>Log every interested client as a booking in this platform</li>
                  <li>Keep bookings updated as they move from New → In Progress → Completed</li>
                  <li>Follow up with clients and add notes to your bookings</li>
                  <li>Work towards your monthly targets to earn bonuses</li>
                </ul>
                <p>You earn a commission on every completed booking. The more you close, the more you earn.</p>
              </div>
            ),
          },
          {
            id: "bookings",
            icon: <BookOpen size={16} />,
            title: "How to Add & Manage Bookings",
            color: "#3b82f6",
            content: (
              <div className="space-y-3 text-sm" style={{ color: "var(--text-60)", lineHeight: 1.7 }}>
                <p><strong style={{ color: "var(--text)" }}>Adding a booking:</strong> Tap "New Booking" from your dashboard. Fill in the client's name, phone number, the service they need, and the estimated project value. The commission is auto-calculated (or you can enter a custom amount).</p>
                <p><strong style={{ color: "var(--text)" }}>Booking statuses:</strong></p>
                <div className="space-y-2">
                  {[
                    { status: "New", color: "#F5A800", desc: "Client has expressed interest. You've logged them in." },
                    { status: "In Progress", color: "#3b82f6", desc: "Work has started or a deal is being negotiated." },
                    { status: "Completed", color: "#22c55e", desc: "Service delivered and payment confirmed. Commission is earned." },
                    { status: "Cancelled", color: "#ef4444", desc: "The client did not proceed. No commission earned." },
                  ].map(({ status, color, desc }) => (
                    <div key={status} className="flex gap-2 items-start">
                      <span className="inline-block w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
                      <p><strong style={{ color }}>{status}:</strong> {desc}</p>
                    </div>
                  ))}
                </div>
                <p><strong style={{ color: "var(--text)" }}>Adding notes:</strong> Inside any booking, use the notes field to log follow-ups, client feedback, or important updates. Good notes help you track your pipeline.</p>
                <p><strong style={{ color: "var(--text)" }}>Deleted bookings:</strong> Deleted bookings go to the Bin, not permanently removed. Admins can restore them if needed.</p>
              </div>
            ),
          },
          {
            id: "commission",
            icon: <WalletIcon size={16} />,
            title: "Commission & How You Earn",
            color: "#22c55e",
            content: (
              <div className="space-y-3 text-sm" style={{ color: "var(--text-60)", lineHeight: 1.7 }}>
                <p>Commission is the percentage of a project's value that you earn when a booking is marked as <strong style={{ color: "#22c55e" }}>Completed</strong>.</p>
                <p><strong style={{ color: "var(--text)" }}>How it works:</strong></p>
                <ul className="space-y-1 pl-4" style={{ listStyleType: "disc" }}>
                  <li>When you add a booking, enter the project value (what the client will pay)</li>
                  <li>Your commission amount is the portion assigned to you for that deal</li>
                  <li>Commission only counts once a booking is marked <strong style={{ color: "#22c55e" }}>Completed</strong></li>
                  <li>Cancelled or In Progress bookings do not count towards your earnings</li>
                </ul>
                <div className="p-3 rounded-xl" style={{ background: "var(--gold-06)", border: "1px solid var(--gold-10)" }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: "#F5A800" }}>Example</p>
                  <p>Client pays ₵5,000 for a website. Your commission is ₵500 (10%). Once the booking is marked Completed, ₵500 is added to your available balance.</p>
                </div>
                <p>Your total earnings are shown on your dashboard as <strong style={{ color: "var(--text)" }}>Total Commission</strong>. This accumulates over all your completed bookings.</p>
              </div>
            ),
          },
          {
            id: "targets",
            icon: <Target size={16} />,
            title: "Monthly Targets & Progress",
            color: "#a855f7",
            content: (
              <div className="space-y-3 text-sm" style={{ color: "var(--text-60)", lineHeight: 1.7 }}>
                <p>Each month, you are given a <strong style={{ color: "var(--text)" }}>sales target</strong> — a goal for the total value of bookings you should close.</p>
                <p><strong style={{ color: "var(--text)" }}>How targets work:</strong></p>
                <ul className="space-y-1 pl-4" style={{ listStyleType: "disc" }}>
                  <li>Your target is set by your manager at the start of each month</li>
                  <li>Your dashboard shows your progress towards the monthly target</li>
                  <li>Only <strong style={{ color: "#22c55e" }}>Completed</strong> bookings count towards your target</li>
                  <li>Reaching or exceeding your target may unlock bonuses — speak to your manager</li>
                </ul>
                <p><strong style={{ color: "var(--text)" }}>Tips for hitting your target:</strong></p>
                <ul className="space-y-1 pl-4" style={{ listStyleType: "disc" }}>
                  <li>Log every lead immediately so nothing slips through</li>
                  <li>Follow up on In Progress bookings at least twice a week</li>
                  <li>Focus on higher-value services (Web, Mobile App) for faster target progress</li>
                  <li>Keep your booking notes updated so your manager can support you</li>
                </ul>
              </div>
            ),
          },
          {
            id: "withdrawal",
            icon: <WalletIcon size={16} />,
            title: "Withdrawals — Getting Paid",
            color: "#F5A800",
            content: (
              <div className="space-y-3 text-sm" style={{ color: "var(--text-60)", lineHeight: 1.7 }}>
                <p>Once your available balance reaches <strong style={{ color: "var(--text)" }}>₵100 or more</strong>, you can request a withdrawal.</p>
                <p><strong style={{ color: "var(--text)" }}>How to withdraw:</strong></p>
                <ol className="space-y-1 pl-4" style={{ listStyleType: "decimal" }}>
                  <li>Go to the <strong style={{ color: "var(--text)" }}>Withdrawals</strong> page from the sidebar</li>
                  <li>Tap <strong style={{ color: "var(--text)" }}>Request Withdrawal</strong></li>
                  <li>Enter the specific amount you want to withdraw</li>
                  <li>Add an optional note (e.g. preferred payment method like MoMo)</li>
                  <li>Submit your request</li>
                </ol>
                <p><strong style={{ color: "var(--text)" }}>Request statuses:</strong></p>
                <div className="space-y-2">
                  {[
                    { s: "Pending", c: "#F5A800", d: "Your request has been submitted and is awaiting review." },
                    { s: "Approved", c: "#3b82f6", d: "Admin has approved. Payment is being processed." },
                    { s: "Completed", c: "#22c55e", d: "Payment has been sent to you. Check your account." },
                    { s: "Rejected", c: "#ef4444", d: "Request was declined. Check the admin note for the reason." },
                  ].map(({ s, c, d }) => (
                    <div key={s} className="flex gap-2 items-start">
                      <span className="inline-block w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: c }} />
                      <p><strong style={{ color: c }}>{s}:</strong> {d}</p>
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-xl" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)" }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: "#ef4444" }}>Important</p>
                  <p>You can only have one open withdrawal request at a time. Wait for it to complete before submitting another.</p>
                </div>
              </div>
            ),
          },
          {
            id: "badge",
            icon: <Award size={16} />,
            title: "Your Verified Badge & Growth Tiers",
            color: "#F5A800",
            content: (
              <div className="space-y-3 text-sm" style={{ color: "var(--text-60)", lineHeight: 1.7 }}>
                <p>As you close more bookings, your profile badge upgrades to reflect your experience and success on the platform.</p>
                <div className="space-y-3">
                  {[
                    { label: "Verified", min: 1, max: 4, color: "#4ade80", desc: "You've made your first booking. Welcome to the team!" },
                    { label: "Rising Star", min: 5, max: 14, color: "#60a5fa", desc: "You're gaining momentum. Keep closing deals!" },
                    { label: "Gold Rep", min: 15, max: 29, color: "#F5A800", desc: "An experienced performer. You're making real impact." },
                    { label: "Elite", min: 30, max: null, color: "#e2e8f0", desc: "Top tier. You're one of the best on the platform." },
                  ].map(({ label, min, max, color, desc }) => (
                    <div key={label} className="flex gap-3 p-3 rounded-xl" style={{ background: "var(--surface-4)", border: "1px solid var(--border-6)" }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: `${color}18`, border: `1px solid ${color}33` }}>
                        <span className="text-xs font-bold" style={{ color }}>{min}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-xs mb-0.5" style={{ color }}>{label} {max ? `(${min}–${max} bookings)` : `(${min}+ bookings)`}</p>
                        <p className="text-xs" style={{ color: "var(--text-50)" }}>{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p>Your badge appears in the sidebar next to your name, visible to you and your team.</p>
              </div>
            ),
          },
          {
            id: "tips",
            icon: <Lightbulb size={16} />,
            title: "Tips for Success",
            color: "#fbbf24",
            content: (
              <div className="space-y-3 text-sm" style={{ color: "var(--text-60)", lineHeight: 1.7 }}>
                <p>Here are proven habits that top-performing reps follow:</p>
                <div className="space-y-2">
                  {[
                    { tip: "Log leads immediately", detail: "Don't wait. The moment a client shows interest, add them as a booking. Memory fades fast." },
                    { tip: "Keep statuses current", detail: "Update booking statuses in real-time. Accurate data helps your manager support you better." },
                    { tip: "Use notes actively", detail: "Log every client interaction — calls, WhatsApp messages, meetings. Notes become your sales memory." },
                    { tip: "Follow up consistently", detail: "Most sales close on the 4th or 5th follow-up. Set reminders and keep going." },
                    { tip: "Know your services", detail: "Study what Westline Techlabs offers. The better you explain it, the easier clients say yes." },
                    { tip: "Ask for referrals", detail: "Happy clients bring new clients. After a completed booking, always ask if they know someone who needs our services." },
                  ].map(({ tip, detail }) => (
                    <div key={tip} className="flex gap-2 items-start p-3 rounded-xl" style={{ background: "var(--surface-4)" }}>
                      <span className="text-xs mt-0.5" style={{ color: "#fbbf24" }}>→</span>
                      <div>
                        <p className="font-semibold text-xs mb-0.5" style={{ color: "var(--text)" }}>{tip}</p>
                        <p className="text-xs" style={{ color: "var(--text-50)" }}>{detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ),
          },
          {
            id: "faq",
            icon: <HelpCircle size={16} />,
            title: "Frequently Asked Questions",
            color: "#94a3b8",
            content: (
              <div className="space-y-4 text-sm" style={{ color: "var(--text-60)", lineHeight: 1.7 }}>
                {[
                  { q: "What if I make a mistake in a booking?", a: "You can edit a booking anytime by opening it and tapping Edit. If you accidentally deleted one, it goes to the Bin — let your manager know to restore it." },
                  { q: "When does commission appear in my balance?", a: "Commission only counts when a booking is marked Completed. In Progress or New bookings do not add to your balance yet." },
                  { q: "Can I request a withdrawal at any time?", a: "Yes, as long as your balance is ₵100 or more and you have no other pending or approved withdrawal request open." },
                  { q: "Why can't I access the Admin Panel?", a: "The Admin Panel is only available to Managers and Owners. Regular Sales Reps do not have access." },
                  { q: "How do I update my profile photo?", a: "Scroll up on this page and tap your avatar. You can upload and crop a new photo directly." },
                  { q: "What if a client changes their mind mid-project?", a: "Update the booking status to Cancelled and add a note explaining what happened. This keeps your pipeline clean and accurate." },
                ].map(({ q, a }) => (
                  <div key={q}>
                    <p className="font-semibold mb-1" style={{ color: "var(--text)" }}>Q: {q}</p>
                    <p style={{ color: "var(--text-55)" }}>A: {a}</p>
                  </div>
                ))}
              </div>
            ),
          },
        ].map((section) => (
          <div
            key={section.id}
            className="glass-card overflow-hidden mb-3"
          >
            <button
              onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
              className="w-full flex items-center justify-between p-4 text-left"
              style={{ background: "transparent" }}
            >
              <div className="flex items-center gap-3">
                <span style={{ color: section.color }}>{section.icon}</span>
                <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>{section.title}</span>
              </div>
              {openSection === section.id
                ? <ChevronUp size={16} style={{ color: "var(--text-30)", flexShrink: 0 }} />
                : <ChevronDown size={16} style={{ color: "var(--text-30)", flexShrink: 0 }} />
              }
            </button>
            {openSection === section.id && (
              <div className="px-4 pb-4" style={{ borderTop: "1px solid var(--border-6)" }}>
                <div className="pt-4">{section.content}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
