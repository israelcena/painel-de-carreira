"use client";

import { useEffect, useState } from "react";

export const SEARCH_EVENT = "painel:search";

/**
 * Lê o parâmetro ?q= da URL sem depender de useSearchParams/Suspense.
 * Inicializa vazio (igual ao SSR) e sincroniza após a hidratação; escuta
 * o evento disparado pela busca da topbar e o popstate do histórico.
 */
export function useSearchQuery(): string {
  const [q, setQ] = useState("");

  useEffect(() => {
    const read = () =>
      setQ(new URLSearchParams(window.location.search).get("q") ?? "");
    read();
    window.addEventListener(SEARCH_EVENT, read);
    window.addEventListener("popstate", read);
    return () => {
      window.removeEventListener(SEARCH_EVENT, read);
      window.removeEventListener("popstate", read);
    };
  }, []);

  return q;
}
