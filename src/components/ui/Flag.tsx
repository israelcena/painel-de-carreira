import * as FlagIcons from "country-flag-icons/react/3x2";
import type { ComponentType, SVGProps } from "react";
import { countryName } from "@/lib/countries";

type FlagComponent = ComponentType<SVGProps<SVGSVGElement> & { title?: string }>;

export function Flag({
  code,
  className = "h-3.5 w-[1.3125rem] rounded-[2px] shadow-sm",
}: {
  code: string;
  className?: string;
}) {
  const key = code.toUpperCase();
  const Icon = (FlagIcons as unknown as Record<string, FlagComponent>)[key];
  if (!Icon) return null;
  return <Icon className={className} title={countryName(code)} />;
}
