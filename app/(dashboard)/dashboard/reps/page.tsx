import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, MapPin, Phone, ChevronRight, Briefcase, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";

export default async function RepsPage() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  if (user?.role !== "OWNER") redirect("/dashboard");

  const reps = await prisma.user.findMany({
    where: { role: "SALES_REP" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      region: true,
      createdAt: true,
      _count: {
        select: { customers: true, deals: true, activities: true },
      },
      deals: {
        where: { stage: "CLOSED_WON" },
        select: { value: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sales Representatives</h1>
        <p className="text-gray-500 text-sm mt-0.5">{reps.length} reps on your team</p>
      </div>

      {reps.length === 0 ? (
        <Card>
          <div className="text-center py-16 text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-50" />
            <p className="font-medium">No sales reps yet</p>
            <p className="text-sm mt-1">Ask your reps to create an account and select &quot;Sales Representative&quot;</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {reps.map((rep) => {
            const revenue = rep.deals.reduce((s, d) => s + d.value, 0);
            return (
              <Link
                key={rep.id}
                href={`/dashboard/reps/${rep.id}`}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                      {rep.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-blue-700">{rep.name}</p>
                      <p className="text-sm text-gray-500">{rep.email}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500" />
                </div>

                <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
                  {rep.region && (
                    <span className="flex items-center gap-1">
                      <MapPin size={13} /> {rep.region}
                    </span>
                  )}
                  {rep.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={13} /> {rep.phone}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                      <Users size={12} />
                    </div>
                    <p className="text-xl font-bold text-gray-900">{rep._count.customers}</p>
                    <p className="text-xs text-gray-400">customers</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                      <Briefcase size={12} />
                    </div>
                    <p className="text-xl font-bold text-gray-900">{rep._count.deals}</p>
                    <p className="text-xs text-gray-400">deals</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                      <Activity size={12} />
                    </div>
                    <p className="text-xl font-bold text-gray-900">{rep._count.activities}</p>
                    <p className="text-xs text-gray-400">activities</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-400">Revenue closed</p>
                  <p className="font-semibold text-green-700">${revenue.toLocaleString()}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
