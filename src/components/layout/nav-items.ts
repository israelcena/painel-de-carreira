import { ChartColumn, History, SquareKanban, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  match: string;
  icon: LucideIcon;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/board/nacional", match: "/board", icon: SquareKanban, label: "Quadros" },
  { href: "/dashboard", match: "/dashboard", icon: ChartColumn, label: "Dashboard" },
  { href: "/historico", match: "/historico", icon: History, label: "Histórico" },
];
