import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OwnerDashboard } from "@/components/dashboard/owner-dashboard";
import { RepDashboard } from "@/components/dashboard/rep-dashboard";

export default async function DashboardPage() {
  const session = await auth();
  const user = session!.user as { id: string; role: string; name?: string | null };

  if (user.role === "OWNER") {
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
      },
      orderBy: { name: "asc" },
    });

    const [totalCustomers, totalDeals, wonDeals] = await Promise.all([
      prisma.customer.count(),
      prisma.deal.count(),
      prisma.deal.count({ where: { stage: "CLOSED_WON" } }),
    ]);

    const revenueData = await prisma.deal.aggregate({
      where: { stage: "CLOSED_WON" },
      _sum: { value: true },
    });

    const pipelineData = await prisma.deal.aggregate({
      where: { stage: { notIn: ["CLOSED_WON", "CLOSED_LOST"] } },
      _sum: { value: true },
    });

    return (
      <OwnerDashboard
        reps={reps}
        stats={{
          totalReps: reps.length,
          totalCustomers,
          totalDeals,
          wonDeals,
          totalRevenue: revenueData._sum.value || 0,
          pipelineValue: pipelineData._sum.value || 0,
        }}
      />
    );
  }

  // Sales Rep dashboard
  const [customers, deals, activities] = await Promise.all([
    prisma.customer.findMany({
      where: { repId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.deal.findMany({
      where: { repId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: { select: { name: true, company: true } } },
    }),
    prisma.activity.findMany({
      where: { repId: user.id },
      orderBy: { date: "desc" },
      take: 10,
      include: { customer: { select: { name: true } } },
    }),
  ]);

  const [customerCount, dealCount, wonDealCount, revenueResult, pipelineResult] = await Promise.all([
    prisma.customer.count({ where: { repId: user.id } }),
    prisma.deal.count({ where: { repId: user.id } }),
    prisma.deal.count({ where: { repId: user.id, stage: "CLOSED_WON" } }),
    prisma.deal.aggregate({ where: { repId: user.id, stage: "CLOSED_WON" }, _sum: { value: true } }),
    prisma.deal.aggregate({
      where: { repId: user.id, stage: { notIn: ["CLOSED_WON", "CLOSED_LOST"] } },
      _sum: { value: true },
    }),
  ]);

  const now = new Date();
  const target = await prisma.target.findUnique({
    where: {
      repId_month_year: {
        repId: user.id,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
    },
  });

  return (
    <RepDashboard
      user={user}
      recentCustomers={customers}
      recentDeals={deals}
      recentActivities={activities}
      stats={{
        totalCustomers: customerCount,
        totalDeals: dealCount,
        wonDeals: wonDealCount,
        totalRevenue: revenueResult._sum.value || 0,
        pipelineValue: pipelineResult._sum.value || 0,
        conversionRate: dealCount > 0 ? Math.round((wonDealCount / dealCount) * 100) : 0,
      }}
      target={target}
    />
  );
}
