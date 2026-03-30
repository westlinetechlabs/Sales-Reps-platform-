import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  const { id } = await params;

  // Allow owner to see any rep, or rep to see their own profile
  if (user.role !== "OWNER" && user.id !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rep = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      region: true,
      createdAt: true,
      customers: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, company: true, status: true, value: true },
      },
      deals: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, value: true, stage: true },
      },
      activities: {
        orderBy: { date: "desc" },
        take: 10,
        select: { id: true, type: true, title: true, date: true, outcome: true },
      },
      _count: {
        select: {
          customers: true,
          deals: true,
          activities: true,
          notes: true,
        },
      },
    },
  });

  if (!rep) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(rep);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  const { id } = await params;

  if (user.role !== "OWNER" && user.id !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await req.json();

  const rep = await prisma.user.update({
    where: { id },
    data: {
      name: data.name,
      phone: data.phone || null,
      region: data.region || null,
    },
    select: { id: true, name: true, email: true, phone: true, region: true },
  });

  return NextResponse.json(rep);
}
