"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TrendingUp, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 flex-col justify-center px-16 text-white">
        <div className="flex items-center gap-3 mb-12">
          <div className="p-3 bg-white/20 rounded-xl">
            <TrendingUp size={28} />
          </div>
          <span className="text-2xl font-bold">SalesRep Platform</span>
        </div>
        <h1 className="text-4xl font-bold mb-4 leading-tight">
          Empower your field<br />sales team
        </h1>
        <p className="text-blue-100 text-lg max-w-md">
          Track customers, manage your pipeline, log activities, and hit your targets — all in one place.
        </p>
        <div className="mt-12 grid grid-cols-2 gap-4 max-w-sm">
          {[
            { label: "Customers", value: "Organized" },
            { label: "Pipeline", value: "Visible" },
            { label: "Activities", value: "Tracked" },
            { label: "Performance", value: "Measured" },
          ].map((item) => (
            <div key={item.label} className="bg-white/10 rounded-xl p-4">
              <p className="text-blue-200 text-xs font-medium uppercase tracking-wide">{item.label}</p>
              <p className="text-white font-semibold mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <TrendingUp size={24} className="text-blue-600" />
            <span className="text-xl font-bold text-gray-900">SalesRep Platform</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
          <p className="text-gray-500 mb-8">Sign in to your account to continue</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Sign in
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-blue-600 font-medium hover:underline">
              Create one
            </Link>
          </p>

          <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs font-medium text-blue-900 mb-2">Demo credentials</p>
            <div className="text-xs text-blue-700 space-y-1">
              <p><span className="font-medium">Owner:</span> owner@demo.com / demo1234</p>
              <p><span className="font-medium">Rep:</span> rep1@demo.com / demo1234</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
