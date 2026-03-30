"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Sidebar } from "@/components/dashboard/sidebar";
import type { SalesRep } from "@/types";
import { AlertTriangle, RefreshCw, LogOut } from "lucide-react";

type LoadState = "loading" | "ready" | "no_profile" | "no_table" | "error";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
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

      // 2. Fetch profile from sales_reps
      const { data: profile, error: profileError } = await supabase
        .from("sales_reps")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (profileError) {
        // Table doesn't exist yet — migration not run
        if (
          profileError.code === "42P01" ||
          profileError.message?.includes("does not exist") ||
          profileError.message?.includes("relation")
        ) {
          setLoadState("no_table");
          return;
        }
        // Row not found — registered via Supabase Auth but profile insert failed
        if (profileError.code === "PGRST116") {
          // Try to auto-create profile from auth metadata
          const meta = session.user.user_metadata as {
            full_name?: string;
          };
          const { data: newProfile, error: insertError } = await supabase
            .from("sales_reps")
            .insert({
              user_id: session.user.id,
              full_name: meta?.full_name || session.user.email?.split("@")[0] || "User",
              email: session.user.email || "",
              role: "rep",
            })
            .select()
            .single();

          if (insertError || !newProfile) {
            setLoadState("no_profile");
            setErrorMsg(insertError?.message || "Profile not found");
            return;
          }

          setRep(newProfile);
          setLoadState("ready");
          return;
        }

        setLoadState("error");
        setErrorMsg(profileError.message);
        return;
      }

      setRep(profile);
      setLoadState("ready");
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
      <div className="h-screen flex items-center justify-center" style={{ background: "#0a0700" }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "#F5A800", borderTopColor: "transparent" }}
          />
          <p className="text-sm" style={{ color: "rgba(232,228,220,0.3)" }}>Loading your portal…</p>
        </div>
      </div>
    );
  }

  // SQL migration not run yet
  if (loadState === "no_table") {
    return (
      <div className="h-screen flex items-center justify-center p-6" style={{ background: "#0a0700" }}>
        <div className="glass-card p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(245,168,0,0.1)" }}>
            <AlertTriangle size={28} style={{ color: "#F5A800" }} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Database setup needed
          </h2>
          <p className="text-sm mb-6" style={{ color: "rgba(232,228,220,0.5)" }}>
            The database tables haven&apos;t been created yet. Please run the SQL migration in your
            Supabase dashboard, then reload this page.
          </p>
          <div className="text-left p-4 rounded-xl mb-6 text-xs font-mono"
            style={{ background: "rgba(255,255,255,0.04)", color: "rgba(245,168,0,0.8)", border: "1px solid rgba(245,168,0,0.1)" }}>
            <p className="mb-1 font-sans text-xs font-semibold" style={{ color: "rgba(232,228,220,0.4)" }}>Steps:</p>
            <p>1. Go to supabase.com/dashboard</p>
            <p>2. Open your project → SQL Editor</p>
            <p>3. Paste & run <strong>supabase/migration.sql</strong></p>
            <p>4. Come back and reload this page</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="btn-gold w-full"
          >
            <RefreshCw size={15} /> Reload after migration
          </button>
          <button onClick={handleSignOut} className="btn-ghost w-full mt-2">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>
    );
  }

  // Profile missing (registered via Auth but profile row not created)
  if (loadState === "no_profile") {
    return (
      <div className="h-screen flex items-center justify-center p-6" style={{ background: "#0a0700" }}>
        <div className="glass-card p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(239,68,68,0.1)" }}>
            <AlertTriangle size={28} style={{ color: "#ef4444" }} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Profile not found
          </h2>
          <p className="text-sm mb-2" style={{ color: "rgba(232,228,220,0.5)" }}>
            Your login exists but your sales rep profile is missing. This can happen if
            the database wasn&apos;t set up when you first registered.
          </p>
          {errorMsg && (
            <p className="text-xs mb-4 p-2 rounded-lg"
              style={{ color: "rgba(239,68,68,0.7)", background: "rgba(239,68,68,0.08)" }}>
              {errorMsg}
            </p>
          )}
          <p className="text-sm mb-6" style={{ color: "rgba(232,228,220,0.4)" }}>
            Make sure the SQL migration has been run, then sign out and create a new account.
          </p>
          <button onClick={handleSignOut} className="btn-gold w-full">
            <LogOut size={14} /> Sign out &amp; re-register
          </button>
        </div>
      </div>
    );
  }

  // Generic error
  if (loadState === "error") {
    return (
      <div className="h-screen flex items-center justify-center p-6" style={{ background: "#0a0700" }}>
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
    <div className="flex h-screen overflow-hidden" style={{ background: "#0a0700" }}>
      <Sidebar rep={rep} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
