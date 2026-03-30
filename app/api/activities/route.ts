import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  const { searchParams } = new URL(req.url);
  const repId = searchParams.get("repId");
  const limit = parseInt(searchParams.get("limit") || "50");

  let where: { repId?: string } = {};
  if (user.role === "OWNER") {
    if (repId) where = { repId };
  } else {
    where = { repId: user.id };
  }

  const activities = await prisma.activity.findMany({
    where,
    orderBy: { date: "desc" },
    take: limit,
    include: {
      customer: { select: { id: true, name: true, company: true } },
      rep: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(activities);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  const data = await req.json();

  const activity = await prisma.activity.create({
    data: {
      type: data.type,
      title: data.title,
      description: data.description || null,
      date: data.date ? new Date(data.date) : new Date(),
      duration: data.duration || null,
      outcome: data.outcome || null,
      repId: user.role === "OWNER" && data.repId ? data.repId : user.id,
      customerId: data.customerId || null,
    },
    include: {
      customer: { select: { id: true, name: true, company: true } },
    },
  });

  return NextResponse.json(activity, { status: 201 });
}
