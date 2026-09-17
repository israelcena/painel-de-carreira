"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Modal } from "./Modal";

/**
 * Diálogo de confirmação no visual do sistema (substitui window.confirm).
 * Construído sobre o Modal: portal, backdrop, fecha no Escape e no clique fora.
 */
export function ConfirmDialog({
  open,
  title,
  subtitle,
  description,
  icon,
  confirmLabel,
  confirmIcon,
  tone = "neutral",
  pending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: ReactNode;
  subtitle?: ReactNode;
  description: ReactNode;
  icon?: ReactNode;
  confirmLabel: string;
  confirmIcon?: ReactNode;
  tone?: "neutral" | "danger";
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const danger = tone === "danger";

  return (
    <Modal open={open} onClose={onCancel} title={title} subtitle={subtitle}>
      <div className="flex items-start gap-3">
        {icon && (
          <div
            className={`grid size-11 shrink-0 place-items-center rounded-full ${
              danger ? "bg-red-50 text-red-500" : "bg-panel text-brand"
            }`}
          >
            {icon}
          </div>
        )}
        <div className="pt-0.5 text-sm font-semibold leading-relaxed text-ink-soft">
          {description}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
        {/* Foco inicial na ação inofensiva (via Modal): um Enter segurado no botão
            que abriu o diálogo não pode confirmar antes de o texto ser lido. */}
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          data-autofocus
          className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-extrabold text-ink-soft transition hover:bg-panel disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-extrabold text-white shadow-card transition hover:brightness-105 disabled:opacity-60 ${
            danger
              ? "bg-gradient-to-r from-red-500 to-rose-500"
              : "bg-gradient-to-r from-brand-violet to-brand-blue"
          }`}
        >
          {pending ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            confirmIcon
          )}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
