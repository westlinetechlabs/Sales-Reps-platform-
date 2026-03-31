"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, User, Phone, Mail, MapPin,
  TrendingUp, Wallet, BookOpen, CheckCircle2,
  Clock, XCircle, AlertCircle, Calendar,
} from "lucide-react";
import type { SalesRep, Booking, WithdrawalRequest } from "@/types";
import { STATUS_CONFIG } from "@/types";
import type { BookingStatus } from "@/types";
import toast from "react-hot-toast";

export default function AdminRepViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [rep, setRep] = useState<SalesRep | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "bookings" | "withdrawals">("overview");

  useEffect(() => {
    async function fetchAll() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Verify caller is admin
      const { data: caller } = await supabase
        .from("sales_reps")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!caller || (caller.role !== "manager" && caller.role !== "owner")) {
        toast.error("Access denied");
        router.push("/admin");
        return;
      }

      const [{ data: repData }, { data: bData }, { data: wData }] = await Promise.all([
        supabase.from("sales_reps").select("*").eq("id", id).maybeSingle(),
        supabase.from("sales_bookings").select("*").eq("rep_id", id).eq("is_deleted", false).order("created_at", { ascending: false }),
        supabase.from("withdrawal_requests").select("*").eq("rep_id", id).order("requested_at", { ascending: false }),
      ]);

      if (!repData) {
        toast.error("Rep not found");
        router.push("/admin");
        return;
      }

      setRep(repData);
      setBookings(bData || []);
      setWithdrawals(wData || []);
      setLoading(false);
    }
    fetchAll();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={28} className="animate-spin" style={{ color: "#F5A800" }} />
      </div>
    );
  }

  if (!rep) return null;

  const totalEarned = bookings.reduce((s, b) => s + b.commission_earned, 0);
  const totalWithdrawn = withdrawals
    .filter((w) => w.status === "completed")
    .reduce((s, w) => s + w.amount, 0);
  const balance = totalEarned - totalWithdrawn;
  const totalValue = bookings.reduce((s, b) => s + b.project_value, 0);
  const completed = bookings.filter((b) => b.status === "completed").length;
  const inProgress = bookings.filter((b) => b.status === "in_progress").length;
  const newCount = bookings.filter((b) => b.status === "new").length;

  const TABS = [
    { key: "overview", label: "Overview" },
    { key: "bookings", label: `Bookings (${bookings.length})` },
    { key: "withdrawals", label: `Withdrawals (${withdrawals.length})` },
  ] as const;

  const WITHDRAWAL_STATUS: Record<string, { label: string; color: string }> = {
    pending:   { label: "Pending",   color: "#F5A800" },
    approved:  { label: "Approved",  color: "#3b82f6" },
    rejected:  { label: "Rejected",  color: "#ef4444" },
    completed: { label: "Completed", color: "#22c55e" },
  };

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto animate-fade-in">
      <button
        onClick={() => router.push("/admin")}
        className="inline-flex items-center gap-2 text-sm mb-6 pt-12 lg:pt-0"
        style={{ color: "var(--text-40)" }}
      >
        <ArrowLeft size={16} /> Back to Admin
      </button>

      {/* Rep profile card */}
      <div className="glass-card p-6 mb-6" style={{ borderColor: "var(--gold-15)" }}>
        <div className="flex items-start gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shrink-0"
            style={{ background: "var(--gold-15)", color: "#F5A800" }}
          >
            {rep.avatar_url ? (
              <img src={rep.avatar_url} alt={rep.full_name} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              rep.full_name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                className="text-2xl font-bold"
                style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text)" }}
              >
                {rep.full_name}
              </h1>
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
                style={{
                  background: rep.role === "owner" ? "rgba(245,168,0,0.15)" : rep.role === "manager" ? "rgba(59,130,246,0.12)" : "var(--surface-4)",
                  color: rep.role === "owner" ? "#F5A800" : rep.role === "manager" ? "#3b82f6" : "var(--text-50)",
                  border: "1px solid var(--border-8)",
                }}
              >
                {rep.role}
              </span>
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{
                  background: rep.status === "active" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.1)",
                  color: rep.status === "active" ? "#22c55e" : "#ef4444",
                }}
              >
                {rep.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-50)" }}>
                <Mail size={13} /> {rep.email}
              </span>
              {rep.phone && (
                <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-50)" }}>
                  <Phone size={13} /> {rep.phone}
                </span>
              )}
              {rep.region && (
                <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-50)" }}>
                  <MapPin size={13} /> {rep.region}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-35)" }}>
                <Calendar size={13} /> Joined {new Date(rep.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { icon: <BookOpen size={16} />, label: "Total Bookings", value: String(bookings.length), gold: false },
          { icon: <TrendingUp size={16} />, label: "Total Project Value", value: `₵${totalValue.toLocaleString()}`, gold: false },
          { icon: <CheckCircle2 size={16} />, label: "Commission Earned", value: `₵${totalEarned.toLocaleString()}`, gold: true },
          { icon: <Wallet size={16} />, label: "Available Balance", value: `₵${balance.toLocaleString()}`, gold: true },
        ].map(({ icon, label, value, gold }) => (
          <div
            key={label}
            className="glass-card p-4"
            style={{ borderColor: gold ? "var(--gold-15)" : "var(--border-8)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span style={{ color: gold ? "#F5A800" : "var(--text-40)" }}>{icon}</span>
              <span className="text-xs" style={{ color: "var(--text-35)" }}>{label}</span>
            </div>
            <p
              className="text-xl font-bold"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                color: gold ? "#F5A800" : "var(--text)",
              }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: "var(--surface-4)", border: "1px solid var(--border-6)" }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all"
            style={
              activeTab === tab.key
                ? { background: "#F5A800", color: "#0a0700" }
                : { color: "var(--text-50)" }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Status breakdown */}
          <div className="glass-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--gold-50)" }}>
              Booking Status Breakdown
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "New", count: newCount, icon: <AlertCircle size={15} />, color: "#F5A800" },
                { label: "In Progress", count: inProgress, icon: <Clock size={15} />, color: "#3b82f6" },
                { label: "Completed", count: completed, icon: <CheckCircle2 size={15} />, color: "#22c55e" },
                { label: "Cancelled", count: bookings.filter((b) => b.status === "cancelled").length, icon: <XCircle size={15} />, color: "#ef4444" },
              ].map(({ label, count, icon, color }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "var(--surface-4)", border: "1px solid var(--border-6)" }}
                >
                  <span style={{ color }}>{icon}</span>
                  <div>
                    <p className="text-xs" style={{ color: "var(--text-35)" }}>{label}</p>
                    <p className="text-xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text)" }}>
                      {count}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent bookings */}
          <div className="glass-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--gold-50)" }}>
              Recent Bookings
            </p>
            {bookings.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-30)" }}>No bookings yet</p>
            ) : (
              <div className="space-y-2">
                {bookings.slice(0, 5).map((b) => {
                  const st = STATUS_CONFIG[b.status as BookingStatus];
                  return (
                    <div
                      key={b.id}
                      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer"
                      style={{ background: "var(--surface-4)", border: "1px solid var(--border-6)" }}
                      onClick={() => router.push(`/dashboard/bookings/${b.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{b.client_name}</p>
                        <p className="text-xs truncate" style={{ color: "var(--text-35)" }}>{b.service_type}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold" style={{ color: "#F5A800", fontFamily: "'Space Grotesk', sans-serif" }}>
                          ₵{b.project_value.toLocaleString()}
                        </p>
                        <span className={`text-xs font-medium ${st.color}`}>{st.label}</span>
                      </div>
                    </div>
                  );
                })}
                {bookings.length > 5 && (
                  <button
                    onClick={() => setActiveTab("bookings")}
                    className="w-full text-xs py-2 rounded-xl"
                    style={{ color: "#F5A800", background: "var(--gold-06)" }}
                  >
                    View all {bookings.length} bookings
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "bookings" && (
        <div className="space-y-3">
          {bookings.length === 0 ? (
            <div className="glass-card py-12 text-center">
              <BookOpen size={36} className="mx-auto mb-3" style={{ color: "var(--text-20)" }} />
              <p className="text-sm" style={{ color: "var(--text-30)" }}>No bookings</p>
            </div>
          ) : (
            bookings.map((b) => {
              const st = STATUS_CONFIG[b.status as BookingStatus];
              return (
                <div
                  key={b.id}
                  className="glass-card p-4 cursor-pointer"
                  onClick={() => router.push(`/dashboard/bookings/${b.id}`)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" style={{ color: "var(--text)", fontFamily: "'Space Grotesk', sans-serif" }}>
                        {b.client_name}
                      </p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-40)" }}>
                        {b.service_type} · {new Date(b.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold" style={{ color: "#F5A800", fontFamily: "'Space Grotesk', sans-serif" }}>
                        ₵{b.project_value.toLocaleString()}
                      </p>
                      <span className={`text-xs font-medium ${st.color}`}>{st.label}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === "withdrawals" && (
        <div className="space-y-3">
          {withdrawals.length === 0 ? (
            <div className="glass-card py-12 text-center">
              <Wallet size={36} className="mx-auto mb-3" style={{ color: "var(--text-20)" }} />
              <p className="text-sm" style={{ color: "var(--text-30)" }}>No withdrawal requests</p>
            </div>
          ) : (
            withdrawals.map((w) => {
              const cfg = WITHDRAWAL_STATUS[w.status] || { label: w.status, color: "var(--text-40)" };
              return (
                <div key={w.id} className="glass-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p
                        className="text-lg font-bold"
                        style={{ color: "#F5A800", fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        ₵{w.amount.toLocaleString()}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-35)" }}>
                        {new Date(w.requested_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                        {w.completed_at && ` → ${new Date(w.completed_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}`}
                      </p>
                      {w.rep_note && (
                        <p className="text-xs mt-1" style={{ color: "var(--text-40)" }}>Note: {w.rep_note}</p>
                      )}
                      {w.admin_note && (
                        <p className="text-xs mt-1 italic" style={{ color: w.status === "rejected" ? "#f87171" : "var(--text-40)" }}>
                          Admin: {w.admin_note}
                        </p>
                      )}
                    </div>
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-medium shrink-0"
                      style={{ background: `${cfg.color}18`, color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
