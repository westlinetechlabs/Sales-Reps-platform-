"use client";

import Link from "next/link";
import {
  Users, DollarSign, Briefcase, TrendingUp, Phone, Mail, Calendar,
  ChevronRight, Activity as ActivityIcon, Target as TargetIcon
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge, getStatusBadgeVariant, getDealStageBadgeVariant } from "@/components/ui/badge";

interface Stats {
  totalCustomers: number;
  totalDeals: number;
  wonDeals: number;
  totalRevenue: number;
  pipelineValue: number;
  conversionRate: number;
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  CALL: <Phone size={14} />,
  EMAIL: <Mail size={14} />,
  MEETING: <Calendar size={14} />,
  DEMO: <ActivityIcon size={14} />,
  VISIT: <ActivityIcon size={14} />,
};

const ACTIVITY_COLORS: Record<string, string> = {
  CALL: "bg-green-50 text-green-700",
  EMAIL: "bg-blue-50 text-blue-700",
  MEETING: "bg-purple-50 text-purple-700",
  DEMO: "bg-orange-50 text-orange-700",
  VISIT: "bg-pink-50 text-pink-700",
};

export function RepDashboard({
  user,
  stats,
  recentCustomers,
  recentDeals,
  recentActivities,
  target,
}: {
  user: { name?: string | null };
  stats: Stats;
  recentCustomers: { id: string; name: string; company?: string | null; status: string; value: number }[];
  recentDeals: {
    id: string;
    title: string;
    value: number;
    stage: string;
    customer?: { name: string; company?: string | null } | null;
  }[];
  recentActivities: {
    id: string;
    type: string;
    title: string;
    date: Date;
    customer?: { name: string } | null;
  }[];
  target: { revenue: number; deals: number; calls: number } | null;
}) {
  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;

  const now = new Date();
  const monthName = now.toLocaleString("default", { month: "long" });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user.name?.split(" ")[0]}!
        </h1>
        <p className="text-gray-500 mt-1">{monthName} {now.getFullYear()} performance overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard
          title="Customers"
          value={stats.totalCustomers}
          icon={<Users size={20} className="text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          title="Total Deals"
          value={stats.totalDeals}
          icon={<Briefcase size={20} className="text-orange-600" />}
          color="bg-orange-50"
        />
        <StatCard
          title="Deals Won"
          value={stats.wonDeals}
          icon={<TrendingUp size={20} className="text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          title="Revenue"
          value={fmt(stats.totalRevenue)}
          icon={<DollarSign size={20} className="text-emerald-600" />}
          color="bg-emerald-50"
        />
        <StatCard
          title="Pipeline"
          value={fmt(stats.pipelineValue)}
          icon={<TrendingUp size={20} className="text-indigo-600" />}
          color="bg-indigo-50"
        />
        <StatCard
          title="Win Rate"
          value={`${stats.conversionRate}%`}
          icon={<TargetIcon size={20} className="text-purple-600" />}
          color="bg-purple-50"
        />
      </div>

      {/* Target progress */}
      {target && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5 mb-6 text-white">
          <div className="flex items-center gap-2 mb-3">
            <TargetIcon size={18} />
            <h3 className="font-semibold">{monthName} Targets</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Revenue", current: stats.totalRevenue, target: target.revenue, fmt: true },
              { label: "Deals Won", current: stats.wonDeals, target: target.deals, fmt: false },
              { label: "Calls", current: recentActivities.filter(a => a.type === "CALL").length, target: target.calls, fmt: false },
            ].map((item) => {
              const pct = item.target > 0 ? Math.min(100, Math.round((item.current / item.target) * 100)) : 0;
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-xs text-blue-100 mb-1">
                    <span>{item.label}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-blue-100 mt-1">
                    {item.fmt ? fmt(item.current) : item.current} / {item.fmt ? fmt(item.target) : item.target}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent customers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Customers</CardTitle>
            <Link href="/dashboard/customers" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View all <ChevronRight size={12} />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentCustomers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No customers yet</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentCustomers.map((c) => (
                  <Link key={c.id} href={`/dashboard/customers`} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-semibold shrink-0">
                      {c.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                      {c.company && <p className="text-xs text-gray-400 truncate">{c.company}</p>}
                    </div>
                    <Badge variant={getStatusBadgeVariant(c.status)}>{c.status}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent deals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Deals</CardTitle>
            <Link href="/dashboard/deals" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View all <ChevronRight size={12} />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentDeals.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No deals yet</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentDeals.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 px-6 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{d.title}</p>
                      <p className="text-xs text-gray-400 truncate">{d.customer?.company || d.customer?.name || "—"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-gray-900">${d.value.toLocaleString()}</p>
                      <Badge variant={getDealStageBadgeVariant(d.stage)} className="mt-0.5">
                        {d.stage.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent activities */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activities</CardTitle>
            <Link href="/dashboard/activities" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View all <ChevronRight size={12} />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No activities yet</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentActivities.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 px-6 py-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${ACTIVITY_COLORS[a.type] || "bg-gray-50 text-gray-600"}`}>
                      {ACTIVITY_ICONS[a.type] || <ActivityIcon size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.title}</p>
                      <p className="text-xs text-gray-400">
                        {a.customer?.name} · {new Date(a.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
