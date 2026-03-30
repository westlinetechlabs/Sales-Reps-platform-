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

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      rep: { select: { id: true, name: true } },
      _count: { select: { deals: true, activities: true } },
    },
  });

  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  const data = await req.json();

  const customer = await prisma.customer.create({
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      company: data.company || null,
      address: data.address || null,
      city: data.city || null,
      status: data.status || "LEAD",
      value: data.value || 0,
      repId: user.role === "OWNER" && data.repId ? data.repId : user.id,
    },
  });

  return NextResponse.json(customer, { status: 201 });
}
