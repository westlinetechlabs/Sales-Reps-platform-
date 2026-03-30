import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  const { id } = await params;

  if (user.role !== "OWNER" && user.id !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [customers, deals, activities] = await Promise.all([
    prisma.customer.groupBy({
      by: ["status"],
      where: { repId: id },
      _count: true,
    }),
    prisma.deal.groupBy({
      by: ["stage"],
      where: { repId: id },
      _count: true,
      _sum: { value: true },
    }),
    prisma.activity.groupBy({
      by: ["type"],
      where: { repId: id },
      _count: true,
    }),
  ]);

  const totalRevenue = deals
    .filter((d) => d.stage === "CLOSED_WON")
    .reduce((sum, d) => sum + (d._sum.value || 0), 0);

  const pipelineValue = deals
    .filter((d) => !["CLOSED_WON", "CLOSED_LOST"].includes(d.stage))
    .reduce((sum, d) => sum + (d._sum.value || 0), 0);

  const totalDeals = deals.reduce((sum, d) => sum + d._count, 0);
  const wonDeals = deals.find((d) => d.stage === "CLOSED_WON")?._count || 0;

  return NextResponse.json({
    customers,
    deals,
    activities,
    summary: {
      totalCustomers: customers.reduce((sum, c) => sum + c._count, 0),
      totalDeals,
      wonDeals,
      totalRevenue,
      pipelineValue,
      conversionRate: totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0,
      totalActivities: activities.reduce((sum, a) => sum + a._count, 0),
    },
  });
}
