import { BriefcaseBusiness } from "lucide-react";
import Link from "next/link";
import { TopbarSearch } from "./TopbarSearch";

export function Topbar({ user }: { user: string }) {
  const initial = user.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 flex h-12 items-stretch bg-gradient-to-r from-brand-violet via-brand to-brand-blue shadow-card">
      <Link
        href="/board/nacional"
        className="flex items-center gap-2 bg-brand-deep px-3 text-white sm:px-4"
      >
        <BriefcaseBusiness size={18} strokeWidth={2.4} />
        <span className="hidden text-sm font-extrabold tracking-tight sm:block">
          Painel de Carreira
        </span>
      </Link>

      <div className="flex min-w-0 flex-1 items-center px-3">
        <TopbarSearch />
      </div>

      <div className="flex items-center gap-2 pr-3 text-white sm:pr-4">
        <span className="hidden text-sm font-bold md:block">{user}</span>
        <div className="grid size-8 place-items-center rounded-full bg-white/25 text-sm font-extrabold">
          {initial}
        </div>
      </div>
    </header>
  );
}
