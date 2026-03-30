"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import {
  Shield, Search, Loader2, Users, DollarSign,
  ChevronDown, Phone, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import type { Booking, BookingStatus, SalesRep } from "@/types";
import { STATUS_CONFIG } from "@/types";
import toast from "react-hot-toast";

const STATUSES: BookingStatus[] = ["new", "in_progress", "completed", "cancelled"];

export default function AdminPage() {
  const [rep, setRep] = useState<SalesRep | null>(null);
  const [reps, setReps] = useState<SalesRep[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [repFilter, setRepFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"bookings" | "commissions">("bookings");

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profile } = await supabase
      .from("sales_reps")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      toast.error("Unauthorized");
      return;
    }

    setRep(profile);

    const [{ data: allReps }, { data: allBookings }] = await Promise.all([
      supabase.from("sales_reps").select("*").order("full_name"),
      supabase
        .from("sales_bookings")
        .select("*, sales_reps(id, full_name, email)")
        .order("created_at", { ascending: false }),
    ]);

    setReps(allReps || []);
    setBookings(allBookings || []);
    setLoading(false);
  }, []);

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

  const filtered = bookings.filter((b) => {
    const matchFilter = filter === "all" || b.status === filter;
    const matchRep = repFilter === "all" || b.rep_id === repFilter;
    const matchSearch =
      b.client_name.toLowerCase().includes(search.toLowerCase()) ||
      b.service_type.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchRep && matchSearch;
  });

  // Commission summary per rep per month
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
            Manage all bookings and view commission summaries
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Reps", value: reps.filter((r) => r.role === "rep").length, icon: <Users size={18} />, color: "#3b82f6" },
          { label: "All Bookings", value: bookings.length, icon: <Shield size={18} />, color: "#F5A800" },
          { label: "Total Revenue", value: `GHS ${totalRevenue.toLocaleString()}`, icon: <DollarSign size={18} />, color: "#22c55e" },
          { label: "Total Commissions", value: `GHS ${totalCommissions}`, icon: <DollarSign size={18} />, color: "#a855f7" },
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
      <div className="flex gap-2 mb-4">
        {(["bookings", "commissions"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all capitalize"
            style={{
              background: tab === t ? "linear-gradient(135deg, #F5A800, #D4920A)" : "rgba(255,255,255,0.04)",
              color: tab === t ? "#000" : "rgba(232,228,220,0.5)",
              border: `1px solid ${tab === t ? "transparent" : "rgba(255,255,255,0.08)"}`,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "bookings" && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(232,228,220,0.3)" }} />
              <input
                placeholder="Search bookings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-dark pl-10"
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

          {/* Bookings list */}
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

                          {/* Status changer */}
                          <div className="relative shrink-0">
                            <div className="relative">
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
                            GHS {b.project_value.toLocaleString()}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium ${status.color}`}
                          >
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

      {tab === "commissions" && (
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
                        Total: GHS{" "}
                        {Object.values(months).reduce((s, m) => s + m.total, 0)}
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
                            <p
                              className="font-bold"
                              style={{ color: "#F5A800", fontFamily: "'Space Grotesk', sans-serif" }}
                            >
                              GHS {data.total}
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
    </div>
  );
}
