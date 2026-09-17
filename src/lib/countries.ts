import countries from "i18n-iso-countries";
import pt from "i18n-iso-countries/langs/pt.json";

countries.registerLocale(pt);

export interface Country {
  code: string;
  name: string;
}

// Ordenada por nome em pt, com o Brasil fixado no topo (escolha mais frequente).
export const COUNTRIES: Country[] = Object.entries(
  countries.getNames("pt", { select: "official" })
)
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => {
    if (a.code === "BR") return -1;
    if (b.code === "BR") return 1;
    return a.name.localeCompare(b.name, "pt");
  });

export function countryName(code: string | null | undefined): string {
  if (!code) return "";
  return countries.getName(code, "pt") ?? code;
}

const ALPHA2_CODES = new Set(COUNTRIES.map((country) => country.code));

/**
 * Código ISO-3166 alpha-2 reconhecido — a mesma lista oferecida no CountrySelect.
 * (`countries.isValid` também aceitaria alpha-3 e numérico, que Flag, o filtro
 * Brasil × exterior e o select não sabem tratar.)
 */
export function isKnownCountry(code: string): boolean {
  return ALPHA2_CODES.has(code);
}
