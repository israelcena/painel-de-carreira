"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { NAV_ITEMS } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-12 z-30 hidden h-[calc(100dvh-3rem)] w-16 shrink-0 flex-col items-center gap-2 bg-white py-4 shadow-card md:flex">
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.match);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={`flex w-14 flex-col items-center gap-0.5 rounded-xl py-2 transition ${
              active
                ? "bg-brand/10 text-brand"
                : "text-muted hover:bg-panel hover:text-ink-soft"
            }`}
          >
            <Icon size={20} strokeWidth={active ? 2.4 : 2} />
            <span className="text-[9px] font-bold">{item.label}</span>
          </Link>
        );
      })}

      <div className="flex-1" />

      <form action={logout}>
        <button
          type="submit"
          title="Sair"
          className="flex w-14 flex-col items-center gap-0.5 rounded-xl py-2 text-muted transition hover:bg-red-50 hover:text-red-500"
        >
          <LogOut size={20} strokeWidth={2} />
          <span className="text-[9px] font-bold">Sair</span>
        </button>
      </form>
    </aside>
  );
}
