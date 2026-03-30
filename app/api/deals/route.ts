import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  const { searchParams } = new URL(req.url);
  const repId = searchParams.get("repId");

  let where: { repId?: string } = {};
  if (user.role === "OWNER") {
    if (repId) where = { repId };
  } else {
    where = { repId: user.id };
  }

  const deals = await prisma.deal.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { id: true, name: true, company: true } },
      rep: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(deals);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  const data = await req.json();

  const deal = await prisma.deal.create({
    data: {
      title: data.title,
      value: data.value || 0,
      stage: data.stage || "PROSPECTING",
      probability: data.probability || 10,
      closeDate: data.closeDate ? new Date(data.closeDate) : null,
      notes: data.notes || null,
      repId: user.role === "OWNER" && data.repId ? data.repId : user.id,
      customerId: data.customerId || null,
    },
    include: {
      customer: { select: { id: true, name: true, company: true } },
    },
  });

  return NextResponse.json(deal, { status: 201 });
}
