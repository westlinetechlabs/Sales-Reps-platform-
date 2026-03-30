import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const data = await req.json();

  const deal = await prisma.deal.update({
    where: { id },
    data: {
      title: data.title,
      value: data.value || 0,
      stage: data.stage,
      probability: data.probability || 10,
      closeDate: data.closeDate ? new Date(data.closeDate) : null,
      notes: data.notes || null,
      customerId: data.customerId || null,
    },
    include: {
      customer: { select: { id: true, name: true, company: true } },
    },
  });

  return NextResponse.json(deal);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.deal.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
