"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0a0700" }}>
        <div className="w-full max-w-md animate-fade-in text-center">
          <div className="glass-card p-10">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(34,197,94,0.1)" }}
            >
              <CheckCircle size={32} style={{ color: "#22c55e" }} />
            </div>
            <h2
              className="text-2xl font-bold text-white mb-3"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Check your email
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(232,228,220,0.5)" }}>
              We sent a password reset link to <strong className="text-white">{email}</strong>.
              Click the link in the email to set a new password.
            </p>
            <p className="text-xs mt-3" style={{ color: "rgba(232,228,220,0.3)" }}>
              Didn&apos;t receive it? Check your spam folder or try again.
            </p>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setSent(false)} className="btn-ghost flex-1 text-sm">
                Try again
              </button>
              <Link href="/login" className="btn-gold flex-1 text-sm">
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0a0700" }}>
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <img
            src="https://res.cloudinary.com/djayrwxns/image/upload/v1770785602/westline_logo_bmusvy.png"
            alt="Westline Techlabs"
            className="h-10"
          />
        </div>

        <div className="glass-card p-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs mb-6"
            style={{ color: "rgba(232,228,220,0.4)" }}
          >
            <ArrowLeft size={13} /> Back to sign in
          </Link>

          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style={{ background: "rgba(245,168,0,0.1)" }}
          >
            <Mail size={22} style={{ color: "#F5A800" }} />
          </div>

          <h2
            className="text-2xl font-bold text-white mb-1"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Forgot password?
          </h2>
          <p className="text-sm mb-6" style={{ color: "rgba(232,228,220,0.5)" }}>
            Enter your email and we&apos;ll send you a reset link.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(232,228,220,0.7)" }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="input-dark"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-full">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
              Send reset link
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
