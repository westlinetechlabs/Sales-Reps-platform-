"use client";

import Link from "next/link";
import { Users, DollarSign, Briefcase, TrendingUp, ChevronRight, MapPin, Phone } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Rep {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  region?: string | null;
  createdAt: Date;
  _count: { customers: number; deals: number; activities: number };
}

interface OwnerStats {
  totalReps: number;
  totalCustomers: number;
  totalDeals: number;
  wonDeals: number;
  totalRevenue: number;
  pipelineValue: number;
}

export function OwnerDashboard({ reps, stats }: { reps: Rep[]; stats: OwnerStats }) {
  const fmt = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Owner Dashboard</h1>
        <p className="text-gray-500 mt-1">Monitor your entire sales team from one place</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard
          title="Total Reps"
          value={stats.totalReps}
          icon={<Users size={20} className="text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          title="Customers"
          value={stats.totalCustomers}
          icon={<Users size={20} className="text-purple-600" />}
          color="bg-purple-50"
        />
        <StatCard
          title="Total Deals"
          value={stats.totalDeals}
          icon={<Briefcase size={20} className="text-orange-600" />}
          color="bg-orange-50"
        />
        <StatCard
          title="Won Deals"
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
      </div>

      {/* Reps grid */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sales Representatives ({reps.length})</CardTitle>
          <Link href="/dashboard/reps" className="text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {reps.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users size={40} className="mx-auto mb-3 opacity-50" />
              <p>No sales reps yet. Ask reps to register.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {reps.map((rep) => (
                <Link
                  key={rep.id}
                  href={`/dashboard/reps/${rep.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold shrink-0">
                    {rep.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 group-hover:text-blue-700">{rep.name}</p>
                    <p className="text-sm text-gray-500 truncate">{rep.email}</p>
                    <div className="flex items-center gap-4 mt-1">
                      {rep.region && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <MapPin size={11} /> {rep.region}
                        </span>
                      )}
                      {rep.phone && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Phone size={11} /> {rep.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-center shrink-0">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{rep._count.customers}</p>
                      <p className="text-xs text-gray-400">customers</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{rep._count.deals}</p>
                      <p className="text-xs text-gray-400">deals</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{rep._count.activities}</p>
                      <p className="text-xs text-gray-400">activities</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
