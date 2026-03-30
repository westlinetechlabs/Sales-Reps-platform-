import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  const { searchParams } = new URL(req.url);
  const repId = searchParams.get("repId") || user.id;

  if (user.role !== "OWNER" && user.id !== repId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const targets = await prisma.target.findMany({
    where: { repId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  return NextResponse.json(targets);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  const data = await req.json();

  const repId = user.role === "OWNER" && data.repId ? data.repId : user.id;

  const target = await prisma.target.upsert({
    where: {
      repId_month_year: {
        repId,
        month: data.month,
        year: data.year,
      },
    },
    update: {
      revenue: data.revenue || 0,
      deals: data.deals || 0,
      calls: data.calls || 0,
      meetings: data.meetings || 0,
    },
    create: {
      repId,
      month: data.month,
      year: data.year,
      revenue: data.revenue || 0,
      deals: data.deals || 0,
      calls: data.calls || 0,
      meetings: data.meetings || 0,
    },
  });

  return NextResponse.json(target);
}
