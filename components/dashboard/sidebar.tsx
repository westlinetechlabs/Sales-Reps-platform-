"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  TrendingUp,
  LayoutDashboard,
  Users,
  Briefcase,
  Activity,
  LogOut,
  UserCircle,
  ChevronRight,
  Target,
} from "lucide-react";

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
    id?: string;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const isOwner = user.role === "OWNER";

  const repLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/customers", label: "Customers", icon: Users },
    { href: "/dashboard/deals", label: "Deals", icon: Briefcase },
    { href: "/dashboard/activities", label: "Activities", icon: Activity },
    { href: "/dashboard/targets", label: "Targets", icon: Target },
  ];

  const ownerLinks = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/reps", label: "Sales Reps", icon: UserCircle },
    { href: "/dashboard/customers", label: "All Customers", icon: Users },
    { href: "/dashboard/deals", label: "All Deals", icon: Briefcase },
    { href: "/dashboard/activities", label: "All Activities", icon: Activity },
  ];

  const links = isOwner ? ownerLinks : repLinks;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">SalesRep</p>
            <p className="text-xs text-gray-500">Platform</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 mx-3 mt-3 bg-gray-50 rounded-xl border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm shrink-0">
            {user.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-500">
              {isOwner ? "Owner / Manager" : "Sales Rep"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          {isOwner ? "Management" : "My Workspace"}
        </p>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon size={18} className={isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"} />
              <span className="flex-1">{link.label}</span>
              {isActive && <ChevronRight size={14} className="text-blue-500" />}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-4">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors group"
        >
          <LogOut size={18} className="text-gray-400 group-hover:text-red-600" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
