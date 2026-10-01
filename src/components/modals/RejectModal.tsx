"use client";

import { useState } from "react";
import { REJECTION_REASON_LABELS, REJECTION_REASON_ORDER } from "@/lib/domain";
import { dateToInput } from "@/lib/format";
import type { AppCard, RejectionReason } from "@/lib/types";
import { ErrorBox, Field, inputCls } from "@/components/ui/fields";
import { Modal } from "@/components/ui/Modal";

export interface RejectPayload {
  reason: RejectionReason;
  note: string;
  rejectedAt: string;
}

/** Current Rejection of an already rejected Application, edited in place. */
export type RejectionValues = Pick<
  AppCard,
  "rejectionReason" | "rejectionNote" | "rejectedAt"
>;

export function RejectModal({
  open,
  appLabel,
  initial,
  pending,
  error,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  appLabel: string;
  /** Present when editing an existing Rejection: the form starts from it. */
  initial?: RejectionValues | null;
  pending: boolean;
  error: string | null;
  onConfirm: (payload: RejectPayload) => void;
  onCancel: () => void;
}) {
  const editing = initial != null;
  // No reason is pre-selected: the user has to pick one before confirming
  const [reason, setReason] = useState<RejectionReason | "">(
    initial?.rejectionReason ?? ""
  );
  const [note, setNote] = useState(initial?.rejectionNote ?? "");
  const [rejectedAt, setRejectedAt] = useState(
    dateToInput(initial?.rejectedAt ?? new Date())
  );

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={editing ? "Editar rejeição" : "Registrar rejeição"}
      subtitle={appLabel}
    >
      <div className="space-y-4">
        <Field label="Motivo da rejeição" htmlFor="reject-reason" required>
          {/* Focus starts here: the opener may have left the page (the card
              moves lanes) or sit behind the overlay */}
          <select
            id="reject-reason"
            data-autofocus
            value={reason}
            onChange={(e) => setReason(e.target.value as RejectionReason)}
            className={inputCls}
          >
            <option value="" disabled>
              Selecione o motivo
            </option>
            {REJECTION_REASON_ORDER.map((key) => (
              <option key={key} value={key}>
                {REJECTION_REASON_LABELS[key]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Data da rejeição" htmlFor="reject-date">
          <input
            id="reject-date"
            type="date"
            value={rejectedAt}
            onChange={(e) => setRejectedAt(e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="Detalhes (opcional)" htmlFor="reject-note">
          <textarea
            id="reject-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Feedback recebido, contexto, aprendizados..."
            className={`${inputCls} resize-y`}
          />
        </Field>

        <ErrorBox message={error} />

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="flex-1 rounded-xl border border-line bg-white py-2.5 text-sm font-extrabold text-ink-soft transition hover:bg-panel disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => reason && onConfirm({ reason, note, rejectedAt })}
            disabled={pending || !reason}
            className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-extrabold text-white transition hover:bg-red-600 disabled:opacity-60"
          >
            {pending
              ? "Salvando..."
              : editing
                ? "Salvar"
                : "Confirmar rejeição"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
