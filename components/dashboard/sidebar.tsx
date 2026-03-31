"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  LayoutDashboard, Plus, UserCircle, LogOut,
  ChevronRight, Shield, X, Wallet, Trash2, BarChart2,
  CheckCircle2, Star, Trophy, Gem, BookOpen,
} from "lucide-react";
import type { SalesRep } from "@/types";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  rep: SalesRep;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

// ── Verified badge tiers ──────────────────────────────────────
type BadgeTier = {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
};

function getRepBadge(count: number): BadgeTier | null {
  if (count >= 30) return {
    label: "Elite",
    color: "#e2e8f0",
    bg: "rgba(226,232,240,0.1)",
    border: "rgba(226,232,240,0.25)",
    icon: <Gem size={10} />,
  };
  if (count >= 15) return {
    label: "Gold Rep",
    color: "#F5A800",
    bg: "rgba(245,168,0,0.1)",
    border: "rgba(245,168,0,0.25)",
    icon: <Trophy size={10} />,
  };
  if (count >= 5) return {
    label: "Rising Star",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.1)",
    border: "rgba(96,165,250,0.22)",
    icon: <Star size={10} />,
  };
  if (count >= 1) return {
    label: "Verified",
    color: "#4ade80",
    bg: "rgba(74,222,128,0.1)",
    border: "rgba(74,222,128,0.22)",
    icon: <CheckCircle2 size={10} />,
  };
  return null;
}

export function Sidebar({ rep, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = rep.role === "manager" || rep.role === "owner";
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [bookingCount, setBookingCount] = useState(0);

  // Fetch booking count for badge
  useEffect(() => {
    async function fetchCount() {
      const supabase = createClient();
      const { count } = await supabase
        .from("sales_bookings")
        .select("id", { count: "exact", head: true })
        .eq("rep_id", rep.id)
        .eq("is_deleted", false);
      setBookingCount(count ?? 0);
    }
    fetchCount();
  }, [rep.id]);

  const badge = getRepBadge(bookingCount);

  const links = [
    { href: "/dashboard",              label: "Dashboard",   icon: LayoutDashboard },
    { href: "/dashboard/bookings/new", label: "New Booking", icon: Plus },
    { href: "/dashboard/reports",      label: "Reports",     icon: BarChart2 },
    { href: "/dashboard/bookings/bin", label: "Bin",         icon: Trash2 },
    { href: "/dashboard/withdrawals",  label: "Withdrawals", icon: Wallet },
    { href: "/dashboard/profile",      label: "Profile",     icon: UserCircle },
    ...(isAdmin ? [{ href: "/admin", label: "Admin Panel", icon: Shield }] : []),
  ];

  async function doSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const roleLabel =
    rep.role === "owner"   ? "Owner"   :
    rep.role === "manager" ? "Manager" : "Sales Rep";

  const nav = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className="px-5 py-5 border-b shrink-0"
        style={{ borderColor: "var(--border-6)" }}
      >
        <img
          src="https://res.cloudinary.com/djayrwxns/image/upload/v1770785602/westline_logo_bmusvy.png"
          alt="Westline Techlabs"
          className="h-12 lg:h-14"
        />
        <p
          className="text-xs mt-1.5 tracking-widest font-semibold"
          style={{ color: "var(--gold-50)" }}
        >
          SALES PORTAL
        </p>
      </div>

      {/* User info */}
      <div
        className="mx-3 mt-4 p-3 rounded-xl shrink-0"
        style={{ background: "var(--gold-06)", border: "1px solid var(--gold-10)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: "linear-gradient(135deg, #F5A800, #D4920A)", color: "#000" }}
          >
            {rep.avatar_url ? (
              <img src={rep.avatar_url} alt={rep.full_name} className="w-full h-full object-cover" />
            ) : (
              rep.full_name[0]?.toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
              {rep.full_name}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
              <p className="text-xs" style={{ color: "var(--gold-60)" }}>{roleLabel}</p>
              {badge && (
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}
                >
                  {badge.icon}
                  {badge.label}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p
          className="px-3 text-[10px] font-semibold uppercase tracking-wider mb-2"
          style={{ color: "var(--text-30)" }}
        >
          Menu
        </p>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <motion.div
              key={link.href}
              whileTap={{ scale: 0.94 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
            >
              <Link
                href={link.href}
                onClick={onMobileClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: isActive ? "var(--gold-10)" : "transparent",
                  color: isActive ? "#F5A800" : "var(--text-50)",
                  border: isActive ? "1px solid var(--gold-15)" : "1px solid transparent",
                }}
              >
                <motion.div
                  animate={isActive ? { scale: 1.15 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <Icon
                    size={17}
                    style={{ color: isActive ? "#F5A800" : "var(--text-30)" }}
                  />
                </motion.div>
                <span className="flex-1">{link.label}</span>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <ChevronRight size={14} style={{ color: "#F5A800" }} />
                  </motion.div>
                )}
              </Link>
            </motion.div>
          );
        })}

        {/* Manual shortcut */}
        <div className="pt-2 mt-2" style={{ borderTop: "1px solid var(--border-6)" }}>
          <Link
            href="/dashboard/profile"
            onClick={onMobileClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ color: "var(--text-40)" }}
          >
            <BookOpen size={16} style={{ color: "var(--text-30)" }} />
            <span>Platform Manual</span>
          </Link>
        </div>
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-5 shrink-0">
        {confirmSignOut ? (
          <div
            className="p-3 rounded-xl space-y-2"
            style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
          >
            <p className="text-xs text-center font-medium" style={{ color: "rgba(239,68,68,0.8)" }}>
              Sign out of your account?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmSignOut(false)}
                className="flex-1 text-xs py-1.5 rounded-full font-medium transition-colors"
                style={{ background: "var(--surface-6)", color: "var(--text-50)" }}
              >
                Cancel
              </button>
              <button
                onClick={doSignOut}
                className="flex-1 text-xs py-1.5 rounded-full font-medium transition-colors"
                style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmSignOut(true)}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-full text-sm font-medium transition-all"
            style={{
              color: "#f87171",
              border: "1px solid rgba(239,68,68,0.2)",
              background: "rgba(239,68,68,0.04)",
            }}
          >
            <LogOut size={15} />
            Sign out
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile slide-in drawer (renders over the top nav) ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-0 z-50 lg:hidden"
              style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
              onClick={onMobileClose}
            />

            {/* Drawer */}
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed left-0 top-0 w-72 h-full z-50 lg:hidden"
              style={{
                background: "var(--sidebar-bg)",
                borderRight: "1px solid var(--border-6)",
                boxShadow: "4px 0 30px rgba(0,0,0,0.4)",
              }}
            >
              <button
                onClick={onMobileClose}
                className="absolute top-4 right-4 p-1 rounded-lg"
                style={{ color: "var(--text-40)" }}
              >
                <X size={18} />
              </button>
              {nav}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Desktop sidebar ── */}
      <aside
        className="w-64 hidden lg:flex flex-col h-full shrink-0"
        style={{
          background: "var(--sidebar-bg)",
          borderRight: "1px solid var(--border-6)",
        }}
      >
        {nav}
      </aside>
    </>
  );
}
