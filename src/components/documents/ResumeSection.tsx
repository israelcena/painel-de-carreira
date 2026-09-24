"use client";

import { Download, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { deleteDocument, uploadDocument } from "@/app/actions/documents";
import {
  DOCUMENT_EXTENSIONS,
  DOCUMENT_MAX_BYTES,
  DOCUMENT_TOO_LARGE,
} from "@/lib/domain";
import { formatBytes, formatDate } from "@/lib/format";
import type { DocumentDTO } from "@/lib/types";
import {
  ErrorBox,
  Field,
  fileInputCls,
  inputCls,
} from "@/components/ui/fields";

function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/** "Nubank, iFood (arquivada)" — cargo só quando a mesma empresa se repete. */
function usageLabel(usedIn: DocumentDTO["usedIn"]): string {
  const perCompany = new Map<string, number>();
  for (const app of usedIn) {
    perCompany.set(app.company, (perCompany.get(app.company) ?? 0) + 1);
  }
  const labels = usedIn.map((app) => {
    const details = [
      (perCompany.get(app.company) ?? 0) > 1 ? app.roleTitle : null,
      app.archived ? "arquivada" : null,
    ].filter(Boolean);
    return details.length > 0
      ? `${app.company} (${details.join(", ")})`
      : app.company;
  });
  return [...new Set(labels)].join(", ");
}

function deleteMessage(doc: DocumentDTO): string {
  const base = `Excluir "${doc.name}" (${doc.fileName})?`;
  const linked = doc.usedIn.length;
  if (linked === 0) return base;
  const archived = doc.usedIn.filter((app) => app.archived).length;
  const archivedPart = archived
    ? ` (${plural(archived, "arquivada", "arquivadas")})`
    : "";
  return `${base}\n\nVinculado a ${plural(linked, "vaga", "vagas")}${archivedPart}; ${
    linked === 1 ? "ela ficará" : "elas ficarão"
  } sem currículo.`;
}

export function ResumeSection({ documents }: { documents: DocumentDTO[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (form: HTMLFormElement) => {
    setError(null);
    const formData = new FormData(form);
    const file = formData.get("file");
    // Acima do limite a action nem chega a rodar: a promise rejeita
    if (file instanceof File && file.size > DOCUMENT_MAX_BYTES) {
      setError(DOCUMENT_TOO_LARGE);
      return;
    }
    startTransition(async () => {
      try {
        const result = await uploadDocument(formData);
        if (result.ok) formRef.current?.reset();
        else setError(result.error);
      } catch {
        setError("Erro ao enviar o arquivo.");
      }
    });
  };

  const remove = (doc: DocumentDTO) => {
    if (!window.confirm(deleteMessage(doc))) return;
    startTransition(async () => {
      try {
        const result = await deleteDocument(doc.id);
        if (!result.ok) setError(result.error);
      } catch {
        setError("Erro ao excluir o arquivo.");
      }
    });
  };

  return (
    <section className="rounded-2xl bg-white p-4 shadow-card md:p-5">
      <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-ink-soft">
        Currículos
      </h2>

      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          submit(e.currentTarget);
        }}
        className="mb-4 grid gap-3 rounded-xl bg-panel p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <Field label="Nome da versão" htmlFor="doc-name">
          <input
            id="doc-name"
            name="name"
            placeholder="Ex.: CV Português, CV English..."
            className={`${inputCls} bg-white`}
          />
        </Field>
        <Field label="Arquivo (PDF, DOC, DOCX... máx. 8 MB)" htmlFor="doc-file">
          <input
            id="doc-file"
            name="file"
            type="file"
            required
            accept={DOCUMENT_EXTENSIONS.join(",")}
            className={fileInputCls}
          />
        </Field>
        <button
          type="submit"
          disabled={pending}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-violet to-brand-blue px-4 py-2.5 text-sm font-extrabold text-white shadow-card transition hover:brightness-105 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Upload size={15} strokeWidth={2.5} />
          )}
          Enviar
        </button>
      </form>

      <ErrorBox message={error} />

      {documents.length === 0 ? (
        <p className="py-6 text-center text-sm font-semibold text-muted">
          Nenhum currículo enviado ainda.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center gap-3 py-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                <FileText size={17} strokeWidth={2.2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-ink">
                  {doc.name}
                </p>
                <p className="truncate text-xs font-semibold text-muted">
                  {doc.fileName} · {formatBytes(doc.size)} ·{" "}
                  {formatDate(doc.createdAt)}
                </p>
                {doc.usedIn.length > 0 && (
                  <p
                    className="truncate text-xs font-bold text-brand"
                    title={usageLabel(doc.usedIn)}
                  >
                    Usado em: {usageLabel(doc.usedIn)}
                  </p>
                )}
              </div>
              <a
                href={`/api/documentos/${doc.id}`}
                download={doc.fileName}
                title="Baixar"
                className="flex items-center gap-1.5 rounded-lg bg-panel px-3 py-1.5 text-xs font-extrabold text-ink-soft transition hover:bg-brand/10 hover:text-brand"
              >
                <Download size={13} strokeWidth={2.5} /> Baixar
              </a>
              <button
                type="button"
                onClick={() => remove(doc)}
                disabled={pending}
                title="Excluir"
                className="rounded-lg p-2 text-muted transition hover:bg-red-50 hover:text-red-500 disabled:opacity-60"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
