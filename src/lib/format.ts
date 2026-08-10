const dateFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });
const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});
const monthFmt = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  year: "2-digit",
});
const relativeFmt = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return dateFmt.format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return dateTimeFmt.format(new Date(date));
}

export function formatMonth(date: Date): string {
  return monthFmt.format(date).replace(".", "");
}

export function daysSince(date: Date | string): number {
  const ms = Date.now() - new Date(date).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export function relativeTime(date: Date | string): string {
  const diffMs = new Date(date).getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60_000);
  if (Math.abs(diffMin) < 60) return relativeFmt.format(diffMin, "minute");
  const diffH = Math.round(diffMin / 60);
  if (Math.abs(diffH) < 24) return relativeFmt.format(diffH, "hour");
  const diffD = Math.round(diffH / 24);
  if (Math.abs(diffD) < 30) return relativeFmt.format(diffD, "day");
  const diffMo = Math.round(diffD / 30);
  return relativeFmt.format(diffMo, "month");
}

/** Converte "2026-08-10" (input date) em Date local ao meio-dia (evita fuso). */
export function dateFromInput(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

/** Converte Date em valor para <input type="date"> */
export function dateToInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
