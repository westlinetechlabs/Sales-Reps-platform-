"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import {
  Wallet, Loader2, ArrowDownToLine, Clock, CheckCircle,
  XCircle, AlertCircle, Plus, X,
} from "lucide-react";
import type { SalesRep, WithdrawalRequest, WithdrawalStatus } from "@/types";
import toast from "react-hot-toast";

const MIN_WITHDRAWAL = 100;

const WITHDRAWAL_STATUS_CONFIG: Record<
  WithdrawalStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending:   { label: "Pending",   color: "#F5A800",  icon: <Clock size={13} /> },
  approved:  { label: "Approved",  color: "#3b82f6",  icon: <CheckCircle size={13} /> },
  rejected:  { label: "Rejected",  color: "#ef4444",  icon: <XCircle size={13} /> },
  completed: { label: "Completed", color: "#22c55e",  icon: <CheckCircle size={13} /> },
};

export default function WithdrawalsPage() {
  const [rep, setRep] = useState<SalesRep | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [repNote, setRepNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

    // Fetch bookings + withdrawals in parallel
    const [{ data: bookings }, { data: wds }] = await Promise.all([
      supabase
        .from("sales_bookings")
        .select("commission_earned")
        .eq("rep_id", profile.id),
      supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("rep_id", profile.id)
        .order("requested_at", { ascending: false }),
    ]);

    const totalEarned = (bookings || []).reduce((s, b) => s + b.commission_earned, 0);
    const totalWithdrawn = (wds || [])
      .filter((w) => w.status === "completed")
      .reduce((s, w) => s + w.amount, 0);

    setBalance(totalEarned - totalWithdrawn);
    setWithdrawals(wds || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!rep) return;

    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount < MIN_WITHDRAWAL) {
      toast.error(`Minimum withdrawal is GHS ${MIN_WITHDRAWAL}`);
      return;
    }
    if (parsedAmount > balance) {
      toast.error("Amount exceeds your available balance");
      return;
    }

    // Check for already-open request
    const hasOpen = withdrawals.some(
      (w) => w.status === "pending" || w.status === "approved"
    );
    if (hasOpen) {
      toast.error("You have a pending or approved request. Wait for it to complete first.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("withdrawal_requests")
      .insert({
        rep_id: rep.id,
        amount: parsedAmount,
        rep_note: repNote || null,
      })
      .select()
      .single();

    setSubmitting(false);

    if (error) {
      toast.error("Failed to submit request");
      console.error(error);
    } else {
      toast.success("Withdrawal request submitted!");
      setWithdrawals((prev) => [data, ...prev]);
      setShowForm(false);
      setAmount("");
      setRepNote("");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={28} className="animate-spin" style={{ color: "#F5A800" }} />
      </div>
    );
  }

  const hasPendingOrApproved = withdrawals.some(
    (w) => w.status === "pending" || w.status === "approved"
  );
  const canRequest = balance >= MIN_WITHDRAWAL && !hasPendingOrApproved;

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pt-12 lg:pt-0">
        <Wallet size={22} style={{ color: "#F5A800" }} />
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Withdrawals
          </h1>
          <p className="text-sm" style={{ color: "rgba(232,228,220,0.4)" }}>
            Request commission payouts
          </p>
        </div>
      </div>

      {/* Balance card */}
      <div
        className="glass-card p-6 mb-6"
        style={{ borderColor: "rgba(245,168,0,0.2)", background: "rgba(245,168,0,0.04)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "rgba(245,168,0,0.6)" }}>
          Available Balance
        </p>
        <p
          className="text-4xl font-bold text-white mb-1"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          GHS {balance.toLocaleString()}
        </p>
        <p className="text-xs" style={{ color: "rgba(232,228,220,0.3)" }}>
          Total earned minus completed withdrawals · Min. GHS {MIN_WITHDRAWAL} to withdraw
        </p>

        <div className="mt-4">
          {balance < MIN_WITHDRAWAL ? (
            <div
              className="flex items-center gap-2 p-3 rounded-xl text-sm"
              style={{ background: "rgba(239,68,68,0.08)", color: "#f87171" }}
            >
              <AlertCircle size={15} />
              Balance below minimum. Earn more to request a withdrawal.
            </div>
          ) : hasPendingOrApproved ? (
            <div
              className="flex items-center gap-2 p-3 rounded-xl text-sm"
              style={{ background: "rgba(245,168,0,0.08)", color: "#F5A800" }}
            >
              <Clock size={15} />
              You have an open request. Wait for it to complete before requesting again.
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="btn-gold flex items-center gap-2"
            >
              <ArrowDownToLine size={16} /> Request Withdrawal
            </button>
          )}
        </div>
      </div>

      {/* Request form */}
      {showForm && (
        <div className="glass-card p-5 mb-6 animate-fade-in" style={{ borderColor: "rgba(245,168,0,0.2)" }}>
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-white">New Withdrawal Request</p>
            <button
              onClick={() => { setShowForm(false); setAmount(""); setRepNote(""); }}
              style={{ color: "rgba(232,228,220,0.3)" }}
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleRequest} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(232,228,220,0.5)" }}>
                Amount (GHS) — max GHS {balance.toLocaleString()}
              </label>
              <input
                type="number"
                min={MIN_WITHDRAWAL}
                max={balance}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder={`Min. ${MIN_WITHDRAWAL}`}
                className="input-dark"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(232,228,220,0.5)" }}>
                Note (optional)
              </label>
              <textarea
                value={repNote}
                onChange={(e) => setRepNote(e.target.value)}
                rows={2}
                placeholder="e.g. MoMo payment preferred"
                className="input-dark resize-none"
              />
            </div>

            {/* Commission preview */}
            {parseFloat(amount) >= MIN_WITHDRAWAL && parseFloat(amount) <= balance && (
              <div
                className="p-3 rounded-xl text-sm"
                style={{ background: "rgba(245,168,0,0.06)", border: "1px solid rgba(245,168,0,0.1)" }}
              >
                <div className="flex justify-between">
                  <span style={{ color: "rgba(232,228,220,0.5)" }}>Requesting</span>
                  <span className="font-bold" style={{ color: "#F5A800" }}>GHS {parseFloat(amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span style={{ color: "rgba(232,228,220,0.5)" }}>Balance after (once completed)</span>
                  <span className="font-semibold text-white">GHS {(balance - parseFloat(amount)).toLocaleString()}</span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button type="submit" disabled={submitting} className="btn-gold flex-1">
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                Submit Request
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setAmount(""); setRepNote(""); }}
                className="btn-ghost"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(232,228,220,0.3)" }}>
          Request History
        </p>

        {withdrawals.length === 0 ? (
          <div className="glass-card py-12 text-center">
            <Wallet size={36} className="mx-auto mb-3" style={{ color: "rgba(232,228,220,0.1)" }} />
            <p className="text-sm" style={{ color: "rgba(232,228,220,0.3)" }}>No withdrawal requests yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((w) => {
              const cfg = WITHDRAWAL_STATUS_CONFIG[w.status as WithdrawalStatus];
              return (
                <div key={w.id} className="glass-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p
                          className="text-lg font-bold"
                          style={{ color: "#F5A800", fontFamily: "'Space Grotesk', sans-serif" }}
                        >
                          GHS {w.amount.toLocaleString()}
                        </p>
                        <span
                          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ background: `${cfg.color}15`, color: cfg.color }}
                        >
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: "rgba(232,228,220,0.3)" }}>
                        Requested {new Date(w.requested_at).toLocaleDateString("en-US", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                        {w.completed_at && ` · Completed ${new Date(w.completed_at).toLocaleDateString("en-US", {
                          day: "numeric", month: "short", year: "numeric",
                        })}`}
                      </p>
                      {w.rep_note && (
                        <p className="text-xs mt-1" style={{ color: "rgba(232,228,220,0.4)" }}>
                          Your note: {w.rep_note}
                        </p>
                      )}
                      {w.admin_note && (
                        <p
                          className="text-xs mt-1 italic"
                          style={{ color: w.status === "rejected" ? "#f87171" : "rgba(232,228,220,0.4)" }}
                        >
                          Admin: {w.admin_note}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
