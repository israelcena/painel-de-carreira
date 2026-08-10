"use client";

import { Globe } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";
import { Flag } from "./Flag";
import { inputCls } from "./fields";

export function CountrySelect({
  value,
  onChange,
  id,
  required,
}: {
  value: string;
  onChange: (code: string) => void;
  id?: string;
  required?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="grid w-8 shrink-0 place-items-center">
        {value ? (
          <Flag code={value} className="h-4 w-6 rounded-[3px] shadow-sm" />
        ) : (
          <Globe size={18} className="text-muted" />
        )}
      </div>
      <select
        id={id}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      >
        <option value="">Selecione o país...</option>
        {COUNTRIES.map((country) => (
          <option key={country.code} value={country.code}>
            {country.name}
          </option>
        ))}
      </select>
    </div>
  );
}
