import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  const { searchParams } = new URL(req.url);
  const repId = searchParams.get("repId");
  const customerId = searchParams.get("customerId");

  const where: { repId?: string; customerId?: string } = {};
  if (user.role === "OWNER") {
    if (repId) where.repId = repId;
  } else {
    where.repId = user.id;
  }
  if (customerId) where.customerId = customerId;

  const notes = await prisma.note.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  const data = await req.json();

  const note = await prisma.note.create({
    data: {
      content: data.content,
      repId: user.role === "OWNER" && data.repId ? data.repId : user.id,
      customerId: data.customerId || null,
    },
  });

  return NextResponse.json(note, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.note.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
