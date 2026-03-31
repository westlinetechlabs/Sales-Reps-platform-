"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Sidebar } from "@/components/dashboard/sidebar";
import type { SalesRep } from "@/types";
import { AlertTriangle, RefreshCw, LogOut, Clock } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

type LoadState = "loading" | "ready" | "pending" | "no_profile" | "no_table" | "error";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { syncFromDB } = useTheme();
  const [rep, setRep] = useState<SalesRep | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const supabase = createClient();

    async function checkAuth() {
      // 1. Check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        router.replace("/login");
        return;
      }

      // 2. Use maybeSingle() — returns null (no error) when row doesn't exist,
      //    only errors on real DB problems like missing table.
      const { data: profile, error: profileError } = await supabase
        .from("sales_reps")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (profileError) {
        // Real DB error — table missing (42P01) or something else
        if (profileError.code === "42P01") {
          setLoadState("no_table");
        } else {
          setLoadState("error");
          setErrorMsg(profileError.message);
        }
        return;
      }

      // Profile found — check if approved
      if (profile) {
        if (profile.status === "inactive") {
          setLoadState("pending");
          return;
        }
        // Sync saved theme preference from DB
        syncFromDB(profile.theme);
        setRep(profile);
        setLoadState("ready");
        return;
      }

      // No profile row yet — auto-create as rep (inactive, pending approval)
      const meta = session.user.user_metadata as { full_name?: string };
      const { data: newProfile, error: insertError } = await supabase
        .from("sales_reps")
        .insert({
          user_id: session.user.id,
          full_name: meta?.full_name || session.user.email?.split("@")[0] || "User",
          email: session.user.email || "",
          role: "rep",
          status: "inactive",
        })
        .select()
        .single();

      if (insertError || !newProfile) {
        setLoadState("no_profile");
        setErrorMsg(insertError?.message || "Could not create profile");
        return;
      }

      // Newly created profile is inactive — must wait for admin approval
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

  // Loading
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

  // Pending approval
  if (loadState === "pending") {
    return (
      <div className="h-screen flex items-center justify-center p-6" style={{ background: "var(--page-bg)" }}>
        <div className="glass-card p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--gold-10)" }}>
            <Clock size={28} style={{ color: "#F5A800" }} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
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

  // SQL migration not run yet
  if (loadState === "no_table") {
    return (
      <div className="h-screen flex items-center justify-center p-6" style={{ background: "var(--page-bg)" }}>
        <div className="glass-card p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--gold-10)" }}>
            <AlertTriangle size={28} style={{ color: "#F5A800" }} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
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

  // Profile row missing and auto-create failed
  if (loadState === "no_profile") {
    return (
      <div className="h-screen flex items-center justify-center p-6" style={{ background: "var(--page-bg)" }}>
        <div className="glass-card p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(239,68,68,0.1)" }}>
            <AlertTriangle size={28} style={{ color: "#ef4444" }} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
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

  // Generic error
  if (loadState === "error") {
    return (
      <div className="h-screen flex items-center justify-center p-6" style={{ background: "var(--page-bg)" }}>
        <div className="glass-card p-8 max-w-md w-full text-center">
          <AlertTriangle size={32} className="mx-auto mb-4" style={{ color: "#ef4444" }} />
          <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
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
      <Sidebar rep={rep} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
