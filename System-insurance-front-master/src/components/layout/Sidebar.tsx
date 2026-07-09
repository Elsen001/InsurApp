"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, CreditCard, BarChart3, Users, ShieldCheck, LogOut, Menu, X, Percent, Gift
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "İdarə Paneli", icon: LayoutDashboard, roles: ["admin", "agent", "subagent"] },
  { href: "/policies", label: "Sığorta al", icon: FileText, roles: ["admin", "agent", "subagent"] },
  { href: "/payments", label: "Ödənişlər", icon: CreditCard, roles: ["admin", "agent", "subagent"] },
  { href: "/my-report", label: "Hesabatım", icon: BarChart3, roles: ["agent", "subagent"] },
  { href: "/my-bonuses", label: "Bonuslarım", icon: Gift, roles: ["agent", "subagent"] },
  { href: "/reports", label: "Hesabatlar", icon: BarChart3, roles: ["admin"] },
  { href: "/agents", label: "Agentlər", icon: Users, roles: ["admin"] },
  { href: "/bonuses", label: "Bonuslar", icon: Gift, roles: ["admin"] },
  { href: "/pricing-rules", label: "Qiymət Qaydaları", icon: Percent, roles: ["admin"] },
];

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const role = (session?.user as any)?.role || "agent";
  const name = session?.user?.name || "";

  const filtered = navItems.filter(item => item.roles.includes(role));

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden bg-primary text-white p-2 rounded-md"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-40 h-full w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300",
        "lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
          <div className="p-2 bg-blue-600 rounded-lg">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="font-bold text-sm">Sığorta Sistemi</p>
            <p className="text-xs text-slate-400 capitalize">{role === "admin" ? "Admin" : role === "subagent" ? "Subagent" : "Agent"}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {filtered.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                pathname === href || pathname.startsWith(href + "/")
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        {/* User & logout */}
        <div className="px-4 py-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{name}</p>
              <p className="text-xs text-slate-400">{session?.user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Çıxış
          </button>
        </div>
      </aside>
    </>
  );
}
