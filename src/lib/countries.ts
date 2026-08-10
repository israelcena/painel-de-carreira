import countries from "i18n-iso-countries";
import pt from "i18n-iso-countries/langs/pt.json";

countries.registerLocale(pt);

export interface Country {
  code: string;
  name: string;
}

export const COUNTRIES: Country[] = Object.entries(
  countries.getNames("pt", { select: "official" })
)
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name, "pt"));

export function countryName(code: string | null | undefined): string {
  if (!code) return "";
  return countries.getName(code, "pt") ?? code;
}
