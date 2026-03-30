import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar user={session.user as { name?: string | null; email?: string | null; role?: string; id?: string }} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
