"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back!");
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0a0700 0%, #1a1200 50%, #0a0700 100%)" }}
      >
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(circle at 30% 50%, rgba(245,168,0,0.15) 0%, transparent 60%), radial-gradient(circle at 70% 80%, rgba(245,168,0,0.1) 0%, transparent 50%)",
          }}
        />
        <div className="relative z-10">
          <img
            src="https://res.cloudinary.com/djayrwxns/image/upload/v1770785602/westline_logo_bmusvy.png"
            alt="Westline Techlabs"
            className="h-14 mb-12"
          />
          <h1
            className="text-4xl font-bold mb-4 leading-tight text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Empower your<br />field sales team
          </h1>
          <p className="text-lg max-w-md" style={{ color: "rgba(232,228,220,0.6)" }}>
            Track bookings, manage your pipeline, earn commissions — all in one place.
          </p>
          <p className="mt-3 text-sm font-medium" style={{ color: "#F5A800" }}>
            Design. Build. Deliver.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-3 max-w-sm">
            {[
              { label: "Bookings", value: "Organized" },
              { label: "Commissions", value: "Tracked" },
              { label: "Clients", value: "Managed" },
              { label: "Performance", value: "Measured" },
            ].map((item) => (
              <div key={item.label} className="glass-card p-4">
                <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "rgba(245,168,0,0.6)" }}>
                  {item.label}
                </p>
                <p className="text-white font-semibold mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6" style={{ background: "#0a0700" }}>
        <div className="w-full max-w-md animate-fade-in">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <img
              src="https://res.cloudinary.com/djayrwxns/image/upload/v1770785602/westline_logo_bmusvy.png"
              alt="Westline Techlabs"
              className="h-10"
            />
          </div>

          <h2
            className="text-2xl font-bold text-white mb-2"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Welcome back
          </h2>
          <p className="mb-8" style={{ color: "rgba(232,228,220,0.5)" }}>
            Sign in to your sales portal
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(232,228,220,0.7)" }}>
                Email
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
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(232,228,220,0.7)" }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="input-dark pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "rgba(232,228,220,0.3)" }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-gold w-full">
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              Sign in
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: "rgba(232,228,220,0.4)" }}>
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium hover:underline" style={{ color: "#F5A800" }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
