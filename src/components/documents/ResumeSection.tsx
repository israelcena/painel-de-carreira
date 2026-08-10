"use client";

import { Download, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { deleteDocument, uploadDocument } from "@/app/actions/documents";
import { formatDate } from "@/lib/format";
import type { DocumentDTO } from "@/lib/types";
import { ErrorBox, Field, inputCls } from "@/components/ui/fields";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ResumeSection({ documents }: { documents: DocumentDTO[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (form: HTMLFormElement) => {
    setError(null);
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await uploadDocument(formData);
      if (result.ok) formRef.current?.reset();
      else setError(result.error);
    });
  };

  const remove = (doc: DocumentDTO) => {
    if (!window.confirm(`Excluir "${doc.name}" (${doc.fileName})?`)) return;
    startTransition(async () => {
      const result = await deleteDocument(doc.id);
      if (!result.ok) setError(result.error);
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
            accept=".pdf,.doc,.docx,.odt,.rtf,.txt,.md"
            className="w-full text-sm font-semibold text-ink-soft file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand/10 file:px-3 file:py-2 file:text-sm file:font-extrabold file:text-brand hover:file:bg-brand/20"
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
