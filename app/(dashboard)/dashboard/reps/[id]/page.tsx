import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Phone, Mail, Users, Briefcase,
  Activity, DollarSign, TrendingUp, Calendar
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge, getStatusBadgeVariant, getDealStageBadgeVariant } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";

export default async function RepDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;

  if (user?.role !== "OWNER") redirect("/dashboard");

  const { id } = await params;

  const rep = await prisma.user.findUnique({
    where: { id },
    include: {
      customers: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      deals: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { customer: { select: { name: true, company: true } } },
      },
      activities: {
        orderBy: { date: "desc" },
        take: 15,
        include: { customer: { select: { name: true } } },
      },
      _count: {
        select: { customers: true, deals: true, activities: true, notes: true },
      },
    },
  });

  if (!rep) notFound();

  const wonDeals = rep.deals.filter((d) => d.stage === "CLOSED_WON");
  const totalRevenue = wonDeals.reduce((s, d) => s + d.value, 0);
  const pipelineDeals = rep.deals.filter((d) => !["CLOSED_WON", "CLOSED_LOST"].includes(d.stage));
  const pipelineValue = pipelineDeals.reduce((s, d) => s + d.value, 0);
  const convRate = rep._count.deals > 0 ? Math.round((wonDeals.length / rep._count.deals) * 100) : 0;

  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;

  const ACTIVITY_COLORS: Record<string, string> = {
    CALL: "bg-green-100 text-green-700",
    MEETING: "bg-purple-100 text-purple-700",
    EMAIL: "bg-blue-100 text-blue-700",
    DEMO: "bg-orange-100 text-orange-700",
    VISIT: "bg-pink-100 text-pink-700",
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Back */}
      <Link href="/dashboard/reps" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={16} /> Back to Reps
      </Link>

      {/* Rep header */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-2xl shrink-0">
            {rep.name[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{rep.name}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1.5"><Mail size={14} /> {rep.email}</span>
              {rep.phone && <span className="flex items-center gap-1.5"><Phone size={14} /> {rep.phone}</span>}
              {rep.region && <span className="flex items-center gap-1.5"><MapPin size={14} /> {rep.region}</span>}
              <span className="flex items-center gap-1.5">
                <Calendar size={14} /> Joined {new Date(rep.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard title="Customers" value={rep._count.customers} icon={<Users size={20} className="text-blue-600" />} color="bg-blue-50" />
        <StatCard title="Total Deals" value={rep._count.deals} icon={<Briefcase size={20} className="text-orange-600" />} color="bg-orange-50" />
        <StatCard title="Deals Won" value={wonDeals.length} icon={<TrendingUp size={20} className="text-green-600" />} color="bg-green-50" />
        <StatCard title="Revenue" value={fmt(totalRevenue)} icon={<DollarSign size={20} className="text-emerald-600" />} color="bg-emerald-50" />
        <StatCard title="Pipeline" value={fmt(pipelineValue)} icon={<TrendingUp size={20} className="text-indigo-600" />} color="bg-indigo-50" />
        <StatCard title="Win Rate" value={`${convRate}%`} icon={<Activity size={20} className="text-purple-600" />} color="bg-purple-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Customers ({rep._count.customers})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {rep.customers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No customers yet</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {rep.customers.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 px-6 py-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-semibold shrink-0">
                      {c.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                      {c.company && <p className="text-xs text-gray-400 truncate">{c.company}</p>}
                    </div>
                    <Badge variant={getStatusBadgeVariant(c.status)}>{c.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Deals ({rep._count.deals})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {rep.deals.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No deals yet</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {rep.deals.map((d) => (
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

        {/* Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities ({rep._count.activities})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {rep.activities.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No activities yet</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {rep.activities.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 px-6 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${ACTIVITY_COLORS[a.type] || "bg-gray-100 text-gray-600"}`}>
                      {a.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.title}</p>
                      <p className="text-xs text-gray-400">
                        {a.customer?.name && `${a.customer.name} · `}
                        {new Date(a.date).toLocaleDateString()}
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
