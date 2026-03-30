import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { role: string };
  if (user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
        select: {
          customers: true,
          deals: true,
          activities: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(reps);
}
