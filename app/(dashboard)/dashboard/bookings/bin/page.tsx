"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { ArrowLeft, Loader2, Trash2, RotateCcw, Inbox } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Booking, SalesRep } from "@/types";
import toast from "react-hot-toast";

export default function BinPage() {
  const [deletedBookings, setDeletedBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profile } = await supabase
      .from("sales_reps")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!profile) return;

    const adminUser = profile.role === "manager" || profile.role === "owner";
    setIsAdmin(adminUser);

    const baseQuery = supabase
      .from("sales_bookings")
      .select("*, sales_reps(id, full_name)")
      .eq("is_deleted", true)
      .order("deleted_at", { ascending: false });

    const { data, error } = adminUser
      ? await baseQuery
      : await baseQuery.eq("rep_id", profile.id);

    if (error) toast.error("Failed to load bin");
    else setDeletedBookings(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function restoreBooking(bookingId: string) {
    setRestoring(bookingId);
    const supabase = createClient();
    const { error } = await supabase
      .from("sales_bookings")
      .update({
        is_deleted: false,
        deleted_at: null,
        delete_note: null,
        is_restored: true,
        restored_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    setRestoring(null);
    if (error) {
      toast.error("Failed to restore booking");
    } else {
      toast.success("Booking restored!");
      setDeletedBookings((prev) => prev.filter((b) => b.id !== bookingId));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={28} className="animate-spin" style={{ color: "#F5A800" }} />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto animate-fade-in">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm mb-6"
        style={{ color: "var(--text-40)" }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div
          className="p-2.5 rounded-xl"
          style={{ background: "rgba(239,68,68,0.1)" }}
        >
          <Trash2 size={20} style={{ color: "#ef4444" }} />
        </div>
        <div>
          <h1
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Deleted Bookings
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-40)" }}>
            {isAdmin ? "All deleted bookings · Admin can restore" : "Your deleted bookings"}
          </p>
        </div>
      </div>

      {deletedBookings.length === 0 ? (
        <div className="glass-card py-16 text-center">
          <Inbox size={40} className="mx-auto mb-3" style={{ color: "rgba(232,228,220,0.15)" }} />
          <p className="font-medium text-white">Bin is empty</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-30)" }}>
            Deleted bookings will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {deletedBookings.map((b) => {
            const repName = (b.sales_reps as unknown as SalesRep)?.full_name;
            return (
              <div key={b.id} className="glass-card p-4 lg:p-5">
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}
                  >
                    {b.client_name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">{b.client_name}</p>
                        <p className="text-sm mt-0.5 truncate" style={{ color: "var(--text-40)" }}>
                          {b.service_type}
                        </p>
                        {isAdmin && repName && (
                          <p className="text-xs mt-0.5" style={{ color: "var(--gold-60)" }}>
                            by {repName}
                          </p>
                        )}
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => restoreBooking(b.id)}
                          disabled={restoring === b.id}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                          style={{
                            background: "rgba(168,85,247,0.12)",
                            color: "#a855f7",
                            border: "1px solid rgba(168,85,247,0.2)",
                          }}
                        >
                          {restoring === b.id
                            ? <Loader2 size={12} className="animate-spin" />
                            : <RotateCcw size={12} />
                          }
                          Restore
                        </button>
                      )}
                    </div>
                    <div className="mt-2 space-y-1.5">
                      {b.deleted_at && (
                        <p className="text-xs" style={{ color: "rgba(239,68,68,0.5)" }}>
                          Deleted {new Date(b.deleted_at).toLocaleDateString("en-US", {
                            day: "numeric", month: "short", year: "numeric"
                          })}
                        </p>
                      )}
                      {b.delete_note && (
                        <div
                          className="text-xs p-2.5 rounded-xl"
                          style={{
                            background: "rgba(239,68,68,0.05)",
                            border: "1px solid rgba(239,68,68,0.1)",
                            color: "var(--text-50)",
                          }}
                        >
                          <span style={{ color: "rgba(239,68,68,0.6)" }}>Reason: </span>
                          {b.delete_note}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
