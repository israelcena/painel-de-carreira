import { PRIORITY_COLORS, PRIORITY_LABELS } from "@/lib/domain";
import type { Priority } from "@/lib/types";

export function PriorityPill({ priority }: { priority: Priority }) {
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white"
      style={{ backgroundColor: PRIORITY_COLORS[priority] }}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
