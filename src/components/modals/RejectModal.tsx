"use client";

import { useState } from "react";
import { REJECTION_REASON_LABELS, REJECTION_REASON_ORDER } from "@/lib/domain";
import { dateToInput } from "@/lib/format";
import type { RejectionReason } from "@/lib/types";
import { ErrorBox, Field, inputCls } from "@/components/ui/fields";
import { Modal } from "@/components/ui/Modal";

export interface RejectPayload {
  reason: RejectionReason;
  note: string;
  rejectedAt: string;
}

export function RejectModal({
  open,
  appLabel,
  pending,
  error,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  appLabel: string;
  pending: boolean;
  error: string | null;
  onConfirm: (payload: RejectPayload) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState<RejectionReason>("SEM_RETORNO");
  const [note, setNote] = useState("");
  const [rejectedAt, setRejectedAt] = useState(dateToInput(new Date()));

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Registrar rejeição"
      subtitle={appLabel}
    >
      <div className="space-y-4">
        <Field label="Motivo da rejeição" htmlFor="reject-reason" required>
          <select
            id="reject-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value as RejectionReason)}
            className={inputCls}
          >
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
            onClick={() => onConfirm({ reason, note, rejectedAt })}
            disabled={pending}
            className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-extrabold text-white transition hover:bg-red-600 disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Confirmar rejeição"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
