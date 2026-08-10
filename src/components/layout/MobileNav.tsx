"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { NAV_ITEMS } from "./nav-items";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] shadow-top md:hidden">
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.match);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 py-2 ${
              active ? "text-brand" : "text-muted"
            }`}
          >
            <Icon size={20} strokeWidth={active ? 2.4 : 2} />
            <span className="text-[10px] font-bold">{item.label}</span>
          </Link>
        );
      })}

      <form action={logout} className="contents">
        <button
          type="submit"
          className="flex flex-col items-center gap-0.5 py-2 text-muted"
        >
          <LogOut size={20} strokeWidth={2} />
          <span className="text-[10px] font-bold">Sair</span>
        </button>
      </form>
    </nav>
  );
}
