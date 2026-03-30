"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Sidebar } from "@/components/dashboard/sidebar";
import type { SalesRep } from "@/types";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [rep, setRep] = useState<SalesRep | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("sales_reps")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (!profile) {
        router.replace("/login");
        return;
      }

      setRep(profile);
      setLoading(false);
    }

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: "#0a0700" }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#F5A800", borderTopColor: "transparent" }} />
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
