"use client";

import { Search, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SEARCH_EVENT } from "@/lib/useSearchQuery";

export function TopbarSearch() {
  const pathname = usePathname();
  const [value, setValue] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visible =
    pathname.startsWith("/board") || pathname.startsWith("/historico");

  // Sincroniza com a URL após a hidratação e ao trocar de página
  // (deferido em um timeout para não disparar setState síncrono no effect)
  useEffect(() => {
    const id = window.setTimeout(() => {
      setValue(new URLSearchParams(window.location.search).get("q") ?? "");
    }, 0);
    return () => window.clearTimeout(id);
  }, [pathname]);

  if (!visible) return null;

  const apply = (next: string) => {
    setValue(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const url = new URL(window.location.href);
      if (next.trim()) url.searchParams.set("q", next.trim());
      else url.searchParams.delete("q");
      window.history.replaceState(null, "", url.toString());
      window.dispatchEvent(new Event(SEARCH_EVENT));
    }, 250);
  };

  return (
    <div className="relative w-full max-w-md">
      <Search
        size={15}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/70"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => apply(e.target.value)}
        placeholder="Buscar por empresa ou cargo..."
        className="h-8 w-full rounded-full bg-white/20 pl-9 pr-8 text-sm font-semibold text-white placeholder-white/60 outline-none transition focus:bg-white/30"
      />
      {value && (
        <button
          type="button"
          onClick={() => apply("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-white/70 hover:text-white"
          aria-label="Limpar busca"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
