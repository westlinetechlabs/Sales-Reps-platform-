"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import {
  BarChart2, Download, Share2, Loader2, ChevronDown,
  TrendingUp, Users, DollarSign, Calendar,
} from "lucide-react";
import { jsPDF } from "jspdf";
import toast from "react-hot-toast";
import type { Booking, SalesRep } from "@/types";

type Period = "daily" | "weekly" | "monthly";

interface RepSummary {
  rep: SalesRep;
  bookings: Booking[];
  totalBookings: number;
  totalValue: number;
  totalCommission: number;
  completed: number;
  inProgress: number;
  newCount: number;
  cancelled: number;
}

function getPeriodRange(period: Period): { start: Date; end: Date; label: string } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (period === "daily") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { start, end, label: now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) };
  } else if (period === "weekly") {
    const start = new Date(now);
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
    return {
      start, end,
      label: `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
    };
  } else {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      start, end,
      label: now.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    };
  }
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("monthly");
  const [viewerRole, setViewerRole] = useState<"rep" | "manager" | "owner">("rep");
  const [currentRepId, setCurrentRepId] = useState<string>("");
  const [allReps, setAllReps] = useState<SalesRep[]>([]);
  const [selectedRepId, setSelectedRepId] = useState<string>("");
  const [summaries, setSummaries] = useState<RepSummary[]>([]);
  const [generating, setGenerating] = useState(false);

  const fetchData = useCallback(async (p: Period) => {
    setLoading(true);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profile } = await supabase
      .from("sales_reps")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!profile) return;

    const role = profile.role as "rep" | "manager" | "owner";
    const isAdmin = role === "manager" || role === "owner";
    setViewerRole(role);
    setCurrentRepId(profile.id);

    const { start } = getPeriodRange(p);

    let repsToFetch: SalesRep[] = [];
    if (isAdmin) {
      const { data: reps } = await supabase
        .from("sales_reps")
        .select("*")
        .eq("status", "active")
        .order("full_name");
      repsToFetch = reps || [];
      setAllReps(repsToFetch);
    } else {
      repsToFetch = [profile];
    }

    const repIds = repsToFetch.map((r) => r.id);

    const { data: bookings } = await supabase
      .from("sales_bookings")
      .select("*")
      .in("rep_id", repIds)
      .eq("is_deleted", false)
      .gte("created_at", start.toISOString());

    const bookingsByRep: Record<string, Booking[]> = {};
    for (const rep of repsToFetch) bookingsByRep[rep.id] = [];
    for (const b of bookings || []) {
      if (bookingsByRep[b.rep_id]) bookingsByRep[b.rep_id].push(b);
    }

    const built: RepSummary[] = repsToFetch.map((rep) => {
      const bs = bookingsByRep[rep.id] || [];
      return {
        rep,
        bookings: bs,
        totalBookings: bs.length,
        totalValue: bs.reduce((s, b) => s + b.project_value, 0),
        totalCommission: bs.reduce((s, b) => s + b.commission_earned, 0),
        completed: bs.filter((b) => b.status === "completed").length,
        inProgress: bs.filter((b) => b.status === "in_progress").length,
        newCount: bs.filter((b) => b.status === "new").length,
        cancelled: bs.filter((b) => b.status === "cancelled").length,
      };
    });

    setSummaries(built);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData(period);
  }, [fetchData, period]);

  const isAdmin = viewerRole === "manager" || viewerRole === "owner";

  const displayedSummaries = isAdmin && selectedRepId
    ? summaries.filter((s) => s.rep.id === selectedRepId)
    : summaries;

  function generatePDFBlob(summary: RepSummary, periodLabel: string): Blob {
    const doc = new jsPDF();
    const w = doc.internal.pageSize.getWidth();

    // Header bar
    doc.setFillColor(10, 7, 0);
    doc.rect(0, 0, w, 40, "F");
    doc.setFillColor(245, 168, 0);
    doc.rect(0, 38, w, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(245, 168, 0);
    doc.text("WESTLINE TECHLABS", 20, 18);
    doc.setFontSize(9);
    doc.setTextColor(180, 170, 150);
    doc.text("Sales Activity Report", 20, 26);
    doc.setFontSize(8);
    doc.setTextColor(150, 145, 135);
    doc.text(periodLabel.toUpperCase(), 20, 34);

    let y = 52;

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(summary.rep.full_name, 20, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 110, 100);
    doc.text(`${summary.rep.email}${summary.rep.phone ? " · " + summary.rep.phone : ""}`, 20, y);
    y += 12;

    // Stats grid
    doc.setFillColor(245, 168, 0);
    doc.rect(20, y, (w - 40) / 4 - 2, 22, "F");
    doc.setFillColor(240, 240, 235);
    doc.rect(20 + (w - 40) / 4, y, (w - 40) / 4 - 2, 22, "F");
    doc.rect(20 + (w - 40) / 2, y, (w - 40) / 4 - 2, 22, "F");
    doc.rect(20 + (3 * (w - 40)) / 4, y, (w - 40) / 4, 22, "F");

    const cols = [20, 20 + (w - 40) / 4, 20 + (w - 40) / 2, 20 + (3 * (w - 40)) / 4];
    const vals = [
      { label: "Bookings", val: String(summary.totalBookings) },
      { label: "Project Value", val: `₵${summary.totalValue.toLocaleString()}` },
      { label: "Commission", val: `₵${summary.totalCommission.toLocaleString()}` },
      { label: "Completed", val: String(summary.completed) },
    ];

    vals.forEach(({ label, val }, i) => {
      const x = cols[i] + 4;
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(i === 0 ? 20 : 90, i === 0 ? 16 : 85, i === 0 ? 0 : 75);
      doc.text(label.toUpperCase(), x, y + 7);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(i === 0 ? 20 : 40, i === 0 ? 16 : 38, i === 0 ? 0 : 35);
      doc.text(val, x, y + 16);
    });

    y += 30;

    // Status breakdown
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(245, 168, 0);
    doc.text("STATUS BREAKDOWN", 20, y);
    y += 2;
    doc.setDrawColor(245, 168, 0);
    doc.setLineWidth(0.3);
    doc.line(20, y, w - 20, y);
    y += 8;

    const statuses = [
      { label: "New", count: summary.newCount },
      { label: "In Progress", count: summary.inProgress },
      { label: "Completed", count: summary.completed },
      { label: "Cancelled", count: summary.cancelled },
    ];
    statuses.forEach(({ label, count }) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 95, 85);
      doc.text(label, 20, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40, 38, 35);
      doc.text(String(count), 80, y);
      y += 7;
    });
    y += 4;

    // Bookings list
    if (summary.bookings.length > 0) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(245, 168, 0);
      doc.text("BOOKINGS", 20, y);
      y += 2;
      doc.line(20, y, w - 20, y);
      y += 8;

      for (const b of summary.bookings) {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(30, 30, 30);
        doc.text(b.client_name, 20, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(120, 115, 105);
        doc.text(`${b.service_type} · ₵${b.project_value.toLocaleString()} · ${b.status.replace("_", " ")}`, 20, y + 5);
        doc.setTextColor(180, 170, 160);
        doc.text(new Date(b.created_at).toLocaleDateString(), w - 20, y, { align: "right" });
        y += 12;
      }
    }

    // Footer
    const pageH = doc.internal.pageSize.getHeight();
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(20, pageH - 20, w - 20, pageH - 20);
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} | Westline Techlabs Sales Portal`,
      20, pageH - 14
    );

    return doc.output("blob");
  }

  function downloadReport(summary: RepSummary) {
    const { label } = getPeriodRange(period);
    const blob = generatePDFBlob(summary, label);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${summary.rep.full_name.replace(/\s+/g, "-").toLowerCase()}-${period}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Report downloaded!");
  }

  async function shareReport(summary: RepSummary) {
    const { label } = getPeriodRange(period);
    const blob = generatePDFBlob(summary, label);
    const fileName = `report-${summary.rep.full_name.replace(/\s+/g, "-").toLowerCase()}-${period}.pdf`;
    const file = new File([blob], fileName, { type: "application/pdf" });

    if (navigator.share && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `Sales Report – ${summary.rep.full_name}`,
          text: `${period.charAt(0).toUpperCase() + period.slice(1)} report for ${summary.rep.full_name}`,
          files: [file],
        });
      } catch {
        // user cancelled
      }
    } else {
      downloadReport(summary);
      toast("Share not supported on this device — PDF downloaded instead.");
    }
  }

  const PERIODS: { value: Period; label: string }[] = [
    { value: "daily", label: "Today" },
    { value: "weekly", label: "This Week" },
    { value: "monthly", label: "This Month" },
  ];

  const { label: periodLabel } = getPeriodRange(period);

  const overallTotals = summaries.reduce(
    (acc, s) => ({
      bookings: acc.bookings + s.totalBookings,
      value: acc.value + s.totalValue,
      commission: acc.commission + s.totalCommission,
      completed: acc.completed + s.completed,
    }),
    { bookings: 0, value: 0, commission: 0, completed: 0 }
  );

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 pt-12 lg:pt-0">
        <div className="flex items-center gap-3">
          <BarChart2 size={22} style={{ color: "#F5A800" }} />
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text)" }}
            >
              Reports
            </h1>
            <p className="text-sm" style={{ color: "var(--text-40)" }}>
              {periodLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex gap-2 mb-6">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all"
            style={
              period === p.value
                ? { background: "#F5A800", color: "#0a0700" }
                : { background: "var(--surface-4)", color: "var(--text-50)", border: "1px solid var(--border-8)" }
            }
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Admin rep filter */}
      {isAdmin && allReps.length > 0 && (
        <div className="mb-6">
          <div className="relative inline-block">
            <select
              value={selectedRepId}
              onChange={(e) => setSelectedRepId(e.target.value)}
              className="input-dark pr-8 appearance-none"
              style={{ minWidth: 180 }}
            >
              <option value="">All Reps</option>
              {allReps.map((r) => (
                <option key={r.id} value={r.id}>{r.full_name}</option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-40)" }}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin" style={{ color: "#F5A800" }} />
        </div>
      ) : (
        <>
          {/* Overall summary — admin only */}
          {isAdmin && !selectedRepId && summaries.length > 1 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {[
                { icon: <Calendar size={16} />, label: "Total Bookings", value: String(overallTotals.bookings) },
                { icon: <DollarSign size={16} />, label: "Total Value", value: `₵${overallTotals.value.toLocaleString()}` },
                { icon: <TrendingUp size={16} />, label: "Commission", value: `₵${overallTotals.commission.toLocaleString()}` },
                { icon: <Users size={16} />, label: "Active Reps", value: String(summaries.filter((s) => s.totalBookings > 0).length) },
              ].map(({ icon, label, value }) => (
                <div
                  key={label}
                  className="glass-card p-4"
                  style={{ borderColor: "var(--gold-15)" }}
                >
                  <div className="flex items-center gap-2 mb-2" style={{ color: "#F5A800" }}>
                    {icon}
                    <span className="text-xs font-medium" style={{ color: "var(--text-40)" }}>{label}</span>
                  </div>
                  <p
                    className="text-xl font-bold"
                    style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text)" }}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Rep summaries */}
          <div className="space-y-4">
            {displayedSummaries.length === 0 ? (
              <div className="glass-card py-16 text-center">
                <BarChart2 size={36} className="mx-auto mb-3" style={{ color: "var(--text-20)" }} />
                <p className="text-sm" style={{ color: "var(--text-30)" }}>
                  No activity in this period
                </p>
              </div>
            ) : (
              displayedSummaries.map((summary) => (
                <div key={summary.rep.id} className="glass-card p-5">
                  {/* Rep header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                        style={{ background: "var(--gold-15)", color: "#F5A800" }}
                      >
                        {summary.rep.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p
                          className="font-semibold"
                          style={{ color: "var(--text)", fontFamily: "'Space Grotesk', sans-serif" }}
                        >
                          {summary.rep.full_name}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-35)" }}>
                          {summary.rep.email}
                          {summary.rep.region ? ` · ${summary.rep.region}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => shareReport(summary)}
                        className="btn-ghost text-xs"
                      >
                        <Share2 size={13} /> Share
                      </button>
                      <button
                        onClick={() => downloadReport(summary)}
                        className="btn-ghost text-xs"
                      >
                        <Download size={13} /> PDF
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    {[
                      { label: "Bookings", value: summary.totalBookings },
                      { label: "Project Value", value: `₵${summary.totalValue.toLocaleString()}` },
                      { label: "Commission", value: `₵${summary.totalCommission.toLocaleString()}`, gold: true },
                      { label: "Completed", value: summary.completed },
                    ].map(({ label, value, gold }) => (
                      <div
                        key={label}
                        className="rounded-xl p-3"
                        style={{ background: "var(--surface-4)", border: "1px solid var(--border-6)" }}
                      >
                        <p className="text-xs mb-1" style={{ color: "var(--text-35)" }}>{label}</p>
                        <p
                          className="text-lg font-bold"
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

                  {/* Status pills */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "New", count: summary.newCount, color: "rgba(245,168,0,0.15)", textColor: "#F5A800" },
                      { label: "In Progress", count: summary.inProgress, color: "rgba(59,130,246,0.12)", textColor: "#3b82f6" },
                      { label: "Completed", count: summary.completed, color: "rgba(34,197,94,0.12)", textColor: "#22c55e" },
                      { label: "Cancelled", count: summary.cancelled, color: "rgba(239,68,68,0.1)", textColor: "#ef4444" },
                    ].filter((s) => s.count > 0).map(({ label, count, color, textColor }) => (
                      <span
                        key={label}
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{ background: color, color: textColor }}
                      >
                        {label}: {count}
                      </span>
                    ))}
                    {summary.totalBookings === 0 && (
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-25)" }}
                      >
                        No bookings this period
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
