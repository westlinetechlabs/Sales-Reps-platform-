"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import {
  Shield, Search, Loader2, Users, DollarSign,
  ChevronDown, Phone, ChevronRight, UserCheck, UserX,
  Trash2, Copy, CheckCheck, Wallet, Clock, CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import type { Booking, BookingStatus, SalesRep, WithdrawalRequest, WithdrawalStatus } from "@/types";
import { STATUS_CONFIG } from "@/types";
import toast from "react-hot-toast";

const STATUSES: BookingStatus[] = ["new", "in_progress", "completed", "cancelled"];

const WD_STATUS_CONFIG: Record<WithdrawalStatus, { label: string; color: string }> = {
  pending:   { label: "Pending",   color: "#F5A800" },
  approved:  { label: "Approved",  color: "#3b82f6" },
  rejected:  { label: "Rejected",  color: "#ef4444" },
  completed: { label: "Completed", color: "#22c55e" },
};

export default function AdminPage() {
  const [rep, setRep] = useState<SalesRep | null>(null);
  const [reps, setReps] = useState<SalesRep[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [withdrawals, setWithdrawals] = useState<(WithdrawalRequest & { sales_reps?: SalesRep })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [repFilter, setRepFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"bookings" | "commissions" | "team" | "withdrawals">("bookings");
  const [tabLoading, setTabLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profile } = await supabase
      .from("sales_reps")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!profile || profile.role !== "admin") {
      toast.error("Unauthorized");
      return;
    }

    setRep(profile);

    const [{ data: allReps }, { data: allBookings }, { data: allWithdrawals }] = await Promise.all([
      supabase.from("sales_reps").select("*").order("full_name"),
      supabase
        .from("sales_bookings")
        .select("*, sales_reps(id, full_name, email)")
        .order("created_at", { ascending: false }),
      supabase
        .from("withdrawal_requests")
        .select("*, sales_reps(id, full_name, email)")
        .order("requested_at", { ascending: false }),
    ]);

    setReps(allReps || []);
    setBookings(allBookings || []);
    setWithdrawals(allWithdrawals || []);
    setLoading(false);
  }, []);

  function handleTabChange(t: typeof tab) {
    setTabLoading(true);
    setTab(t);
    setTimeout(() => setTabLoading(false), 300);
  }

  async function updateWithdrawal(id: string, status: WithdrawalStatus, adminNote?: string) {
    const supabase = createClient();
    const updates: Record<string, unknown> = { status };
    if (adminNote) updates.admin_note = adminNote;
    if (status === "completed") updates.completed_at = new Date().toISOString();

    const { error } = await supabase
      .from("withdrawal_requests")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast.error("Failed to update withdrawal");
    } else {
      toast.success(`Withdrawal ${status}`);
      setWithdrawals((prev) =>
        prev.map((w) =>
          w.id === id
            ? { ...w, status, admin_note: adminNote || w.admin_note, completed_at: status === "completed" ? new Date().toISOString() : w.completed_at }
            : w
        )
      );
    }
  }

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function updateStatus(bookingId: string, newStatus: BookingStatus) {
    const supabase = createClient();
    const { error } = await supabase
      .from("sales_bookings")
      .update({ status: newStatus })
      .eq("id", bookingId);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Status updated to ${STATUS_CONFIG[newStatus].label}`);
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: newStatus, updated_at: new Date().toISOString() } : b
        )
      );
    }
  }

  async function toggleRepStatus(repId: string, currentStatus: string) {
    const supabase = createClient();
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const { error } = await supabase
      .from("sales_reps")
      .update({ status: newStatus })
      .eq("id", repId);

    if (error) {
      toast.error("Failed to update rep status");
    } else {
      toast.success(`Rep ${newStatus === "active" ? "activated" : "deactivated"}`);
      setReps((prev) =>
        prev.map((r) => (r.id === repId ? { ...r, status: newStatus as "active" | "inactive" } : r))
      );
    }
  }

  async function changeRepRole(repId: string, newRole: "rep" | "admin") {
    const supabase = createClient();
    const { error } = await supabase
      .from("sales_reps")
      .update({ role: newRole })
      .eq("id", repId);

    if (error) {
      toast.error("Failed to update role");
    } else {
      toast.success(`Role updated to ${newRole}`);
      setReps((prev) =>
        prev.map((r) => (r.id === repId ? { ...r, role: newRole } : r))
      );
    }
  }

  async function removeRep(repId: string, repName: string) {
    if (!confirm(`Remove ${repName}? This will delete all their bookings too.`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("sales_reps").delete().eq("id", repId);
    if (error) {
      toast.error("Failed to remove rep");
    } else {
      toast.success(`${repName} removed`);
      setReps((prev) => prev.filter((r) => r.id !== repId));
    }
  }

  function copyInviteLink() {
    const url = `${window.location.origin}/register`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      toast.success("Invite link copied!");
      setTimeout(() => setLinkCopied(false), 3000);
    });
  }

  const filtered = bookings.filter((b) => {
    const matchFilter = filter === "all" || b.status === filter;
    const matchRep = repFilter === "all" || b.rep_id === repFilter;
    const matchSearch =
      b.client_name.toLowerCase().includes(search.toLowerCase()) ||
      b.service_type.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchRep && matchSearch;
  });

  const commissionSummary = bookings.reduce(
    (acc: Record<string, Record<string, { total: number; count: number }>>, b) => {
      const repName = (b.sales_reps as unknown as SalesRep)?.full_name || "Unknown";
      const d = new Date(b.created_at);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!acc[repName]) acc[repName] = {};
      if (!acc[repName][month]) acc[repName][month] = { total: 0, count: 0 };
      acc[repName][month].total += b.commission_earned;
      acc[repName][month].count++;
      return acc;
    },
    {}
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={28} className="animate-spin" style={{ color: "#F5A800" }} />
      </div>
    );
  }

  if (!rep || rep.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm" style={{ color: "rgba(232,228,220,0.4)" }}>Unauthorized</p>
      </div>
    );
  }

  const totalRevenue = bookings.reduce((s, b) => s + b.project_value, 0);
  const totalCommissions = bookings.reduce((s, b) => s + b.commission_earned, 0);
  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending").length;

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pt-12 lg:pt-0">
        <Shield size={22} style={{ color: "#F5A800" }} />
        <div>
          <h1
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Admin Panel
          </h1>
          <p className="text-sm" style={{ color: "rgba(232,228,220,0.4)" }}>
            Manage your team, bookings, and commissions
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Reps", value: reps.filter((r) => r.role === "rep").length, icon: <Users size={18} />, color: "#3b82f6" },
          { label: "All Bookings", value: bookings.length, icon: <Shield size={18} />, color: "#F5A800" },
          { label: "Total Revenue", value: `₵${totalRevenue.toLocaleString()}`, icon: <DollarSign size={18} />, color: "#22c55e" },
          { label: "Pending Payouts", value: pendingWithdrawals, icon: <Wallet size={18} />, color: "#a855f7" },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs" style={{ color: "rgba(232,228,220,0.4)" }}>{s.label}</p>
                <p
                  className="text-lg font-bold text-white mt-1"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {s.value}
                </p>
              </div>
              <div className="p-2 rounded-xl" style={{ background: `${s.color}15`, color: s.color }}>
                {s.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab toggle */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(["bookings", "commissions", "withdrawals", "team"] as const).map((t) => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all capitalize"
            style={{
              background: tab === t ? "linear-gradient(135deg, #F5A800, #D4920A)" : "rgba(255,255,255,0.04)",
              color: tab === t ? "#000" : "rgba(232,228,220,0.5)",
              border: `1px solid ${tab === t ? "transparent" : "rgba(255,255,255,0.08)"}`,
            }}
          >
            {t === "team" ? `Team (${reps.length})` : t === "withdrawals" && pendingWithdrawals > 0 ? `Withdrawals (${pendingWithdrawals})` : t}
          </button>
        ))}
      </div>

      {/* ── TAB LOADING SKELETON ── */}
      {tabLoading && (
        <div className="space-y-3 animate-fade-in">
          {[1,2,3].map((i) => (
            <div key={i} className="glass-card p-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl skeleton shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-40 rounded" />
                  <div className="skeleton h-3 w-24 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── BOOKINGS TAB ── */}
      {!tabLoading && tab === "bookings" && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(232,228,220,0.3)" }} />
              <input
                placeholder="Search bookings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-dark"
                style={{ paddingLeft: "2.5rem" }}
              />
            </div>
            <select
              value={repFilter}
              onChange={(e) => setRepFilter(e.target.value)}
              className="input-dark max-w-48"
            >
              <option value="all">All Reps</option>
              {reps
                .filter((r) => r.role === "rep")
                .map((r) => (
                  <option key={r.id} value={r.id}>{r.full_name}</option>
                ))}
            </select>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-dark max-w-40"
            >
              <option value="all">All Status</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="glass-card py-16 text-center">
              <p className="text-sm" style={{ color: "rgba(232,228,220,0.3)" }}>No bookings found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((b) => {
                const status = STATUS_CONFIG[b.status as BookingStatus];
                const repName = (b.sales_reps as unknown as SalesRep)?.full_name || "—";
                return (
                  <div key={b.id} className="glass-card p-4 lg:p-5">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                        style={{ background: "rgba(245,168,0,0.1)", color: "#F5A800" }}
                      >
                        {b.client_name[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-white truncate">{b.client_name}</p>
                              <Link
                                href={`/dashboard/bookings/${b.id}`}
                                className="shrink-0"
                                style={{ color: "rgba(232,228,220,0.2)" }}
                              >
                                <ChevronRight size={14} />
                              </Link>
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: "rgba(232,228,220,0.35)" }}>
                              {b.service_type} · by <span style={{ color: "rgba(245,168,0,0.6)" }}>{repName}</span>
                            </p>
                          </div>
                          <div className="relative shrink-0">
                            <select
                              value={b.status}
                              onChange={(e) => updateStatus(b.id, e.target.value as BookingStatus)}
                              className="appearance-none text-xs font-medium px-3 py-1.5 pr-7 rounded-full border cursor-pointer"
                              style={{
                                background: "rgba(255,255,255,0.04)",
                                borderColor: "rgba(255,255,255,0.1)",
                                color: "#e8e4dc",
                              }}
                            >
                              {STATUSES.map((s) => (
                                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                              ))}
                            </select>
                            <ChevronDown
                              size={12}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                              style={{ color: "rgba(232,228,220,0.3)" }}
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                          <a
                            href={`tel:${b.client_phone}`}
                            className="flex items-center gap-1 text-xs hover:underline"
                            style={{ color: "rgba(232,228,220,0.35)" }}
                          >
                            <Phone size={11} /> {b.client_phone}
                          </a>
                          <span className="text-xs" style={{ color: "rgba(232,228,220,0.25)" }}>
                            {new Date(b.created_at).toLocaleDateString()}
                          </span>
                          <span className="text-xs font-semibold" style={{ color: "#F5A800" }}>
                            ₵{b.project_value.toLocaleString()}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${status.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                            {status.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── COMMISSIONS TAB ── */}
      {!tabLoading && tab === "commissions" && (
        <div className="space-y-4">
          {Object.keys(commissionSummary).length === 0 ? (
            <div className="glass-card py-16 text-center">
              <p className="text-sm" style={{ color: "rgba(232,228,220,0.3)" }}>No commission data yet</p>
            </div>
          ) : (
            Object.entries(commissionSummary)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([repName, months]) => (
                <div key={repName} className="glass-card p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: "linear-gradient(135deg, #F5A800, #D4920A)", color: "#000" }}
                    >
                      {repName[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{repName}</p>
                      <p className="text-xs" style={{ color: "rgba(232,228,220,0.3)" }}>
                        Total: ₵{Object.values(months).reduce((s, m) => s + m.total, 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(months)
                      .sort(([a], [b]) => b.localeCompare(a))
                      .map(([month, data]) => {
                        const [y, m] = month.split("-");
                        const label = new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        });
                        return (
                          <div
                            key={month}
                            className="flex items-center justify-between p-3 rounded-xl"
                            style={{ background: "rgba(255,255,255,0.02)" }}
                          >
                            <div>
                              <p className="text-sm text-white">{label}</p>
                              <p className="text-xs" style={{ color: "rgba(232,228,220,0.3)" }}>
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
                </div>
              ))
          )}
        </div>
      )}

      {/* ── WITHDRAWALS TAB ── */}
      {!tabLoading && tab === "withdrawals" && (
        <div className="space-y-4">
          {withdrawals.length === 0 ? (
            <div className="glass-card py-16 text-center">
              <Wallet size={36} className="mx-auto mb-3" style={{ color: "rgba(232,228,220,0.1)" }} />
              <p className="text-sm" style={{ color: "rgba(232,228,220,0.3)" }}>No withdrawal requests yet</p>
            </div>
          ) : (
            withdrawals.map((w) => {
              const repName = (w.sales_reps as unknown as SalesRep)?.full_name || "Unknown";
              const cfg = WD_STATUS_CONFIG[w.status as WithdrawalStatus];
              return (
                <div key={w.id} className="glass-card p-4 lg:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Rep + amount info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ background: "linear-gradient(135deg, #F5A800, #D4920A)", color: "#000" }}
                        >
                          {repName[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{repName}</p>
                          <p className="text-xs" style={{ color: "rgba(232,228,220,0.35)" }}>
                            {new Date(w.requested_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold mt-2" style={{ color: "#F5A800", fontFamily: "'Space Grotesk', sans-serif" }}>
                        ₵{w.amount.toLocaleString()}
                      </p>
                      {w.rep_note && (
                        <p className="text-xs mt-1" style={{ color: "rgba(232,228,220,0.4)" }}>
                          Rep note: {w.rep_note}
                        </p>
                      )}
                      {w.admin_note && (
                        <p className="text-xs mt-1 italic" style={{ color: "rgba(232,228,220,0.35)" }}>
                          Your note: {w.admin_note}
                        </p>
                      )}
                      {w.completed_at && (
                        <p className="text-xs mt-1" style={{ color: "#22c55e" }}>
                          Completed {new Date(w.completed_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      )}
                    </div>

                    {/* Status + actions */}
                    <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{ background: `${cfg.color}15`, color: cfg.color }}
                      >
                        {w.status === "completed" ? <CheckCircle size={12} /> : w.status === "rejected" ? <XCircle size={12} /> : <Clock size={12} />}
                        {cfg.label}
                      </span>

                      {/* Pending actions */}
                      {w.status === "pending" && (
                        <div className="space-y-2 w-full sm:w-auto">
                          <textarea
                            placeholder="Admin note (optional)"
                            rows={1}
                            value={adminNotes[w.id] || ""}
                            onChange={(e) => setAdminNotes((prev) => ({ ...prev, [w.id]: e.target.value }))}
                            className="input-dark resize-none text-xs w-full sm:w-48"
                            style={{ padding: "6px 10px" }}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateWithdrawal(w.id, "approved", adminNotes[w.id])}
                              className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 px-3 rounded-full font-medium"
                              style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)" }}
                            >
                              <CheckCircle size={12} /> Approve
                            </button>
                            <button
                              onClick={() => updateWithdrawal(w.id, "rejected", adminNotes[w.id])}
                              className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 px-3 rounded-full font-medium"
                              style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)" }}
                            >
                              <XCircle size={12} /> Reject
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Approved — admin has sent money, mark complete */}
                      {w.status === "approved" && (
                        <div className="space-y-2 w-full sm:w-auto">
                          <p className="text-xs" style={{ color: "rgba(59,130,246,0.7)" }}>
                            Send the money, then mark as completed.
                          </p>
                          <button
                            onClick={() => updateWithdrawal(w.id, "completed", adminNotes[w.id])}
                            className="w-full flex items-center justify-center gap-1 text-xs py-1.5 px-3 rounded-full font-medium"
                            style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}
                          >
                            <CheckCircle size={12} /> Mark as Completed
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── TEAM TAB ── */}
      {!tabLoading && tab === "team" && (
        <div className="space-y-4">
          {/* Invite banner */}
          <div
            className="glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-3"
            style={{ borderColor: "rgba(245,168,0,0.2)" }}
          >
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Add a new team member</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(232,228,220,0.4)" }}>
                Share the sign-up link. New accounts are <strong className="text-white">pending</strong> until you approve them here.
              </p>
            </div>
            <button
              onClick={copyInviteLink}
              className="btn-gold flex items-center gap-2 shrink-0 text-sm"
            >
              {linkCopied ? <CheckCheck size={15} /> : <Copy size={15} />}
              {linkCopied ? "Copied!" : "Copy Invite Link"}
            </button>
          </div>

          {/* Pending approvals */}
          {reps.filter((r) => r.status === "inactive" && r.id !== rep.id).length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "rgba(245,168,0,0.7)" }}>
                Pending Approval ({reps.filter((r) => r.status === "inactive" && r.id !== rep.id).length})
              </p>
              <div className="space-y-2">
                {reps
                  .filter((r) => r.status === "inactive" && r.id !== rep.id)
                  .map((r) => (
                    <div
                      key={r.id}
                      className="glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                      style={{ borderColor: "rgba(245,168,0,0.25)" }}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                          style={{ background: "rgba(245,168,0,0.15)", color: "#F5A800" }}
                        >
                          {r.full_name[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">{r.full_name}</p>
                          <p className="text-xs truncate" style={{ color: "rgba(232,228,220,0.4)" }}>
                            {r.email}{r.phone && ` · ${r.phone}`}{r.region && ` · ${r.region}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => toggleRepStatus(r.id, "inactive")}
                          className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                          style={{ background: "linear-gradient(135deg, #F5A800, #D4920A)", color: "#000" }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => removeRep(r.id, r.full_name)}
                          className="p-2 rounded-xl"
                          style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Active reps list */}
          {reps.filter((r) => r.status === "active").length === 0 ? (
            <div className="glass-card py-16 text-center">
              <p className="text-sm" style={{ color: "rgba(232,228,220,0.3)" }}>No team members yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reps.filter((r) => r.status === "active").map((r) => {
                const isMe = r.id === rep.id;
                const repBookings = bookings.filter((b) => b.rep_id === r.id);
                return (
                  <div key={r.id} className="glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Avatar + info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                        style={{ background: "linear-gradient(135deg, #F5A800, #D4920A)", color: "#000" }}
                      >
                        {r.full_name[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white truncate">{r.full_name}</p>
                          {isMe && (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full shrink-0"
                              style={{ background: "rgba(245,168,0,0.15)", color: "#F5A800" }}
                            >
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs truncate" style={{ color: "rgba(232,228,220,0.35)" }}>
                          {r.email}
                          {r.phone && ` · ${r.phone}`}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "rgba(232,228,220,0.25)" }}>
                          {repBookings.length} booking{repBookings.length !== 1 ? "s" : ""}
                          {r.region && ` · ${r.region}`}
                        </p>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Status badge */}
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{
                          background: r.status === "active" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                          color: r.status === "active" ? "#22c55e" : "#ef4444",
                        }}
                      >
                        {r.status}
                      </span>

                      {/* Role badge */}
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{
                          background: r.role === "admin" ? "rgba(168,85,247,0.1)" : "rgba(59,130,246,0.1)",
                          color: r.role === "admin" ? "#a855f7" : "#3b82f6",
                        }}
                      >
                        {r.role}
                      </span>

                      {!isMe && (
                        <>
                          {/* Toggle active */}
                          <button
                            onClick={() => toggleRepStatus(r.id, r.status)}
                            title={r.status === "active" ? "Deactivate" : "Activate"}
                            className="p-2 rounded-xl transition-colors"
                            style={{ background: "rgba(255,255,255,0.04)", color: "rgba(232,228,220,0.5)" }}
                          >
                            {r.status === "active" ? <UserX size={15} /> : <UserCheck size={15} />}
                          </button>

                          {/* Toggle role */}
                          <button
                            onClick={() => changeRepRole(r.id, r.role === "rep" ? "admin" : "rep")}
                            title={r.role === "rep" ? "Promote to admin" : "Demote to rep"}
                            className="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
                            style={{ background: "rgba(255,255,255,0.04)", color: "rgba(232,228,220,0.5)" }}
                          >
                            {r.role === "rep" ? "Make Admin" : "Make Rep"}
                          </button>

                          {/* Remove */}
                          <button
                            onClick={() => removeRep(r.id, r.full_name)}
                            title="Remove rep"
                            className="p-2 rounded-xl transition-colors"
                            style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
