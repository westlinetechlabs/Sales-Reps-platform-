"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  LayoutDashboard, Plus, UserCircle, LogOut,
  ChevronRight, Shield, Menu, X,
} from "lucide-react";
import type { SalesRep } from "@/types";
import { useState } from "react";
import toast from "react-hot-toast";

interface SidebarProps {
  rep: SalesRep;
}

export function Sidebar({ rep }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = rep.role === "admin";
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/bookings/new", label: "New Booking", icon: Plus },
    { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
    ...(isAdmin ? [{ href: "/admin", label: "Admin Panel", icon: Shield }] : []),
  ];

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.push("/login");
  }

  const nav = (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <img
          src="https://res.cloudinary.com/djayrwxns/image/upload/v1770785602/westline_logo_bmusvy.png"
          alt="Westline Techlabs"
          className="h-8"
        />
        <p className="text-[10px] mt-1 tracking-wider font-medium" style={{ color: "rgba(245,168,0,0.5)" }}>
          SALES PORTAL
        </p>
      </div>

      {/* User info */}
      <div className="mx-3 mt-4 p-3 rounded-xl" style={{ background: "rgba(245,168,0,0.06)", border: "1px solid rgba(245,168,0,0.1)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: "linear-gradient(135deg, #F5A800, #D4920A)", color: "#000" }}
          >
            {rep.full_name[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{rep.full_name}</p>
            <p className="text-xs" style={{ color: "rgba(245,168,0,0.6)" }}>
              {isAdmin ? "Owner / Manager" : "Sales Rep"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(232,228,220,0.3)" }}>
          Menu
        </p>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group"
              style={{
                background: isActive ? "rgba(245,168,0,0.1)" : "transparent",
                color: isActive ? "#F5A800" : "rgba(232,228,220,0.5)",
                border: isActive ? "1px solid rgba(245,168,0,0.15)" : "1px solid transparent",
              }}
            >
              <Icon size={17} style={{ color: isActive ? "#F5A800" : "rgba(232,228,220,0.3)" }} />
              <span className="flex-1">{link.label}</span>
              {isActive && <ChevronRight size={14} style={{ color: "#F5A800" }} />}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-4">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ color: "rgba(232,228,220,0.4)" }}
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-xl lg:hidden"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <Menu size={20} style={{ color: "#F5A800" }} />
      </button>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 h-full flex flex-col" style={{ background: "#0d0a02", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1"
              style={{ color: "rgba(232,228,220,0.4)" }}
            >
              <X size={18} />
            </button>
            {nav}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className="w-64 hidden lg:flex flex-col h-full shrink-0"
        style={{ background: "#0d0a02", borderRight: "1px solid rgba(255,255,255,0.06)" }}
      >
        {nav}
      </aside>
    </>
  );
}
