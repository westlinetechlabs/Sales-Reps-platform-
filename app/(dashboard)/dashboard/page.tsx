"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import {
  FileText, TrendingUp, Clock, DollarSign, Plus,
  Search, Phone, ChevronRight, Loader2, Inbox, Trash2, Pencil, RotateCcw,
} from "lucide-react";
import type { Booking, BookingStatus, SalesRep } from "@/types";
import { STATUS_CONFIG } from "@/types";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function BookingSkeleton() {
  return (
    <div className="glass-card p-4 lg:p-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl skeleton shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-36 rounded" />
          <div className="skeleton h-3 w-24 rounded" />
          <div className="flex gap-4 mt-2">
            <div className="skeleton h-3 w-20 rounded" />
            <div className="skeleton h-3 w-16 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [rep, setRep] = useState<SalesRep | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [tabLoading, setTabLoading] = useState(false);
  const [search, setSearch] = useState("");

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
    setRep(profile);

    const { data: bks, error } = await supabase
      .from("sales_bookings")
      .select("*")
      .eq("rep_id", profile.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load bookings");
    } else {
      setBookings(bks || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleFilterChange(value: string) {
    setTabLoading(true);
    setFilter(value);
    setTimeout(() => setTabLoading(false), 300);
  }

  const filtered = bookings.filter((b) => {
    const matchFilter = filter === "all" || b.status === filter;
    const matchSearch =
      b.client_name.toLowerCase().includes(search.toLowerCase()) ||
      b.service_type.toLowerCase().includes(search.toLowerCase()) ||
      b.client_phone.includes(search);
    return matchFilter && matchSearch;
  });

  const totalBookings = bookings.length;
  const activeProjects = bookings.filter((b) => b.status === "in_progress").length;
  const completedProjects = bookings.filter((b) => b.status === "completed").length;
  const totalCommission = bookings.reduce((sum, b) => sum + b.commission_earned, 0);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={28} className="animate-spin" style={{ color: "#F5A800" }} />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 pt-12 lg:pt-0">
        <div>
          <h1
            className="text-2xl lg:text-3xl font-bold text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Welcome back, {rep?.full_name.split(" ")[0]}!
          </h1>
          <p className="mt-1 text-sm" style={{ color: "rgba(232,228,220,0.4)" }}>{today}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/bookings/bin" className="btn-ghost text-sm">
            <Trash2 size={15} /> Bin
          </Link>
          <Link href="/dashboard/bookings/new" className="btn-gold">
            <Plus size={16} /> New Booking
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Bookings", value: totalBookings, icon: <FileText size={20} />, color: "#3b82f6" },
          { label: "Active Projects", value: activeProjects, icon: <Clock size={20} />, color: "#F5A800" },
          { label: "Completed", value: completedProjects, icon: <TrendingUp size={20} />, color: "#22c55e" },
          { label: "Total Commission", value: `₵${totalCommission.toLocaleString()}`, icon: <DollarSign size={20} />, color: "#F5A800" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-4 lg:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium" style={{ color: "rgba(232,228,220,0.4)" }}>{stat.label}</p>
                <p
                  className="text-xl lg:text-2xl font-bold mt-1 text-white"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {stat.value}
                </p>
              </div>
              <div className="p-2.5 rounded-xl" style={{ background: `${stat.color}15`, color: stat.color }}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Search — icon is decorative, padding ensures text never overlaps it */}
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "rgba(232,228,220,0.3)" }}
          />
          <input
            placeholder="Search bookings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-dark"
            style={{ paddingLeft: "2.5rem" }}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <motion.button
              key={f.value}
              onClick={() => handleFilterChange(f.value)}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              className="px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap relative overflow-hidden"
              style={{
                background: filter === f.value ? "linear-gradient(135deg, #F5A800, #D4920A)" : "rgba(255,255,255,0.04)",
                color: filter === f.value ? "#000" : "rgba(232,228,220,0.5)",
                border: `1px solid ${filter === f.value ? "transparent" : "rgba(255,255,255,0.08)"}`,
              }}
            >
              {filter === f.value && (
                <motion.span
                  layoutId="filter-pill"
                  className="absolute inset-0 rounded-full"
                  style={{ background: "linear-gradient(135deg, #F5A800, #D4920A)", zIndex: -1 }}
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                />
              )}
              {f.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Bookings list */}
      <AnimatePresence mode="wait">
      {tabLoading ? (
        <motion.div
          key="skeleton"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-3"
        >
          {[1, 2, 3].map((i) => <BookingSkeleton key={i} />)}
        </motion.div>
      ) : filtered.length === 0 ? (
        <motion.div
          key={`empty-${filter}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="glass-card py-16 text-center"
        >
          <Inbox size={40} className="mx-auto mb-3" style={{ color: "rgba(232,228,220,0.15)" }} />
          <p className="font-medium text-white">
            {bookings.length === 0 ? "No bookings yet" : "No matching bookings"}
          </p>
          <p className="text-sm mt-1" style={{ color: "rgba(232,228,220,0.3)" }}>
            {bookings.length === 0
              ? "Go make your first sale!"
              : "Try adjusting your search or filters"}
          </p>
          {bookings.length === 0 && (
            <Link href="/dashboard/bookings/new" className="btn-gold mt-4 inline-flex">
              <Plus size={14} /> Create First Booking
            </Link>
          )}
        </motion.div>
      ) : (
        <motion.div
          key={`list-${filter}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="space-y-3"
        >
          {filtered.map((b) => {
            const status = STATUS_CONFIG[b.status as BookingStatus];
            return (
              <Link
                key={b.id}
                href={`/dashboard/bookings/${b.id}`}
                className="glass-card glass-card-hover block p-4 lg:p-5 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: "rgba(245,168,0,0.1)", color: "#F5A800" }}
                  >
                    {b.client_name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">{b.client_name}</p>
                        <p className="text-sm mt-0.5 truncate" style={{ color: "rgba(232,228,220,0.4)" }}>
                          {b.service_type}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            color: status.color.replace("text-", ""),
                            border: "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                        <ChevronRight size={16} className="hidden sm:block" style={{ color: "rgba(232,228,220,0.15)" }} />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                      <a
                        href={`tel:${b.client_phone}`}
                        onClick={(e) => e.stopPropagation()}
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
                      <span className="text-xs" style={{ color: "rgba(34,197,94,0.7)" }}>
                        +₵{b.commission_earned.toLocaleString()}
                      </span>
                      {b.is_restored && (
                        <span className="inline-flex items-center gap-1 text-xs" style={{ color: "#a855f7" }}>
                          <RotateCcw size={10} /> Restored
                        </span>
                      )}
                      {b.is_edited && !b.is_restored && (
                        <span className="inline-flex items-center gap-1 text-xs" style={{ color: "rgba(59,130,246,0.7)" }}>
                          <Pencil size={10} /> {b.edited_by_admin ? "Edited by admin" : "Edited"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
