"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Sidebar } from "@/components/dashboard/sidebar";
import ManualPrompt from "@/components/ManualPrompt";
import type { SalesRep } from "@/types";
import { AlertTriangle, RefreshCw, LogOut, Clock, Menu } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

type LoadState = "loading" | "ready" | "pending" | "blocked" | "no_profile" | "no_table" | "error";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { syncFromDB } = useTheme();
  const [rep, setRep] = useState<SalesRep | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function checkAuth() {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("sales_reps")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (profileError) {
        if (profileError.code === "42P01") {
          setLoadState("no_table");
        } else {
          setLoadState("error");
          setErrorMsg(profileError.message);
        }
        return;
      }

      if (profile) {
        // Blocked by admin — cannot re-enter
        if (profile.is_blocked) {
          setLoadState("blocked");
          return;
        }
        if (profile.status === "inactive") {
          setLoadState("pending");
          return;
        }
        syncFromDB(profile.theme);
        setRep(profile);
        setLoadState("ready");
        return;
      }

      // No profile for this user_id yet.
      // Guard: check if another account with the same email is already blocked
      // to prevent duplicate approval requests from the same person.
      const userEmail = session.user.email || "";
      const { data: existingByEmail } = await supabase
        .from("sales_reps")
        .select("id, is_blocked, status")
        .eq("email", userEmail)
        .maybeSingle();

      if (existingByEmail?.is_blocked) {
        setLoadState("blocked");
        return;
      }

      // If an inactive (pending) profile already exists for this email on a
      // different auth account, show pending instead of creating a duplicate.
      if (existingByEmail && existingByEmail.status === "inactive") {
        setLoadState("pending");
        return;
      }

      const meta = session.user.user_metadata as { full_name?: string };
      const { data: newProfile, error: insertError } = await supabase
        .from("sales_reps")
        .insert({
          user_id: session.user.id,
          full_name: meta?.full_name || userEmail.split("@")[0] || "User",
          email: userEmail,
          role: "rep",
          status: "inactive",
          is_blocked: false,
        })
        .select()
        .single();

      if (insertError || !newProfile) {
        setLoadState("no_profile");
        setErrorMsg(insertError?.message || "Could not create profile");
        return;
      }

      setLoadState("pending");
    }

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
    });

    return () => subscription.unsubscribe();
  }, [router]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loadState === "loading") {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: "var(--page-bg)" }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "#F5A800", borderTopColor: "transparent" }}
          />
          <p className="text-sm" style={{ color: "var(--text-40)" }}>Loading your portal…</p>
        </div>
      </div>
    );
  }

  if (loadState === "pending") {
    return (
      <div className="h-screen flex items-center justify-center p-6" style={{ background: "var(--page-bg)" }}>
        <div className="glass-card p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--gold-10)" }}>
            <Clock size={28} style={{ color: "#F5A800" }} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text)" }}>
            Awaiting approval
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-50)" }}>
            Your account is pending review by the admin. You&apos;ll have full access once approved.
            Contact your manager if you need urgent access.
          </p>
          <button onClick={handleSignOut} className="btn-ghost w-full">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>
    );
  }

  if (loadState === "blocked") {
    return (
      <div className="h-screen flex items-center justify-center p-6" style={{ background: "var(--page-bg)" }}>
        <div className="glass-card p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(239,68,68,0.1)" }}>
            <AlertTriangle size={28} style={{ color: "#ef4444" }} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text)" }}>
            Account removed
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-50)" }}>
            Your account has been removed by an administrator. Contact your manager if you believe this is a mistake.
          </p>
          <button onClick={handleSignOut} className="btn-ghost w-full">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>
    );
  }

  if (loadState === "no_table") {
    return (
      <div className="h-screen flex items-center justify-center p-6" style={{ background: "var(--page-bg)" }}>
        <div className="glass-card p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--gold-10)" }}>
            <AlertTriangle size={28} style={{ color: "#F5A800" }} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text)" }}>
            Database setup needed
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-50)" }}>
            The database tables haven&apos;t been created yet. Please run the SQL migration
            in your Supabase dashboard, then reload this page.
          </p>
          <div className="text-left p-4 rounded-xl mb-6 text-xs"
            style={{ background: "var(--surface-4)", color: "rgba(245,168,0,0.8)", border: "1px solid var(--gold-10)" }}>
            <p className="mb-1 font-semibold" style={{ color: "var(--text-40)" }}>Steps:</p>
            <p>1. Go to supabase.com/dashboard</p>
            <p>2. Open your project → SQL Editor</p>
            <p>3. Paste &amp; run supabase/migration.sql</p>
            <p>4. Come back and reload this page</p>
          </div>
          <button onClick={() => window.location.reload()} className="btn-gold w-full">
            <RefreshCw size={15} /> Reload after migration
          </button>
          <button onClick={handleSignOut} className="btn-ghost w-full mt-2">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>
    );
  }

  if (loadState === "no_profile") {
    return (
      <div className="h-screen flex items-center justify-center p-6" style={{ background: "var(--page-bg)" }}>
        <div className="glass-card p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(239,68,68,0.1)" }}>
            <AlertTriangle size={28} style={{ color: "#ef4444" }} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text)" }}>
            Profile setup failed
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--text-50)" }}>
            Could not create your sales rep profile. Run this SQL in Supabase to fix it:
          </p>
          <div className="text-left p-4 rounded-xl mb-6 text-xs font-mono overflow-x-auto"
            style={{ background: "var(--surface-4)", color: "rgba(245,168,0,0.8)", border: "1px solid var(--gold-10)" }}>
            INSERT INTO sales_reps (user_id, full_name, email, role)<br />
            VALUES (&#39;YOUR-USER-UUID&#39;, &#39;Your Name&#39;, &#39;your@email.com&#39;, &#39;admin&#39;);
          </div>
          {errorMsg && (
            <p className="text-xs mb-4 p-2 rounded-lg"
              style={{ color: "rgba(239,68,68,0.7)", background: "rgba(239,68,68,0.08)" }}>
              {errorMsg}
            </p>
          )}
          <div className="flex gap-2">
            <button onClick={() => window.location.reload()} className="btn-ghost flex-1">
              <RefreshCw size={14} /> Retry
            </button>
            <button onClick={handleSignOut} className="btn-ghost flex-1">
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="h-screen flex items-center justify-center p-6" style={{ background: "var(--page-bg)" }}>
        <div className="glass-card p-8 max-w-md w-full text-center">
          <AlertTriangle size={32} className="mx-auto mb-4" style={{ color: "#ef4444" }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>Something went wrong</h2>
          <p className="text-xs mb-4 p-2 rounded-lg"
            style={{ color: "rgba(239,68,68,0.7)", background: "rgba(239,68,68,0.08)" }}>
            {errorMsg}
          </p>
          <div className="flex gap-2">
            <button onClick={() => window.location.reload()} className="btn-ghost flex-1">
              <RefreshCw size={14} /> Retry
            </button>
            <button onClick={handleSignOut} className="btn-ghost flex-1">
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!rep) return null;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--page-bg)" }}>
      {/* Desktop sidebar + mobile drawer */}
      <Sidebar rep={rep} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      {/* Content column */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* ── Mobile top nav bar (static, always visible on mobile) ── */}
        <header
          className="lg:hidden flex items-center justify-between px-4 shrink-0"
          style={{
            height: 56,
            background: "var(--sidebar-bg)",
            borderBottom: "1px solid var(--border-6)",
            position: "sticky",
            top: 0,
            zIndex: 40,
          }}
        >
          <img
            src="https://res.cloudinary.com/djayrwxns/image/upload/v1770785602/westline_logo_bmusvy.png"
            alt="Westline Techlabs"
            style={{ height: 32 }}
          />
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl"
            style={{
              background: "var(--surface-4)",
              border: "1px solid var(--border-8)",
            }}
          >
            <Menu size={20} style={{ color: "#F5A800" }} />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Welcome manual prompt for new reps */}
      <ManualPrompt rep={rep} />
    </div>
  );
}
