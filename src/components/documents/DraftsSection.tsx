"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { createTextDoc, deleteTextDoc, saveTextDoc } from "@/app/actions/texts";
import { formatDateTime } from "@/lib/format";
import type { TextDocDTO } from "@/lib/types";
import { ErrorBox, inputCls } from "@/components/ui/fields";

function DraftCard({ draft }: { draft: TextDocDTO }) {
  const [title, setTitle] = useState(draft.title);
  const [content, setContent] = useState(draft.content);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const save = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveTextDoc(draft.id, { title, content });
      if (result.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        setError(result.error);
      }
    });
  };

  const remove = () => {
    if (!window.confirm(`Excluir o rascunho "${draft.title}"?`)) return;
    startTransition(async () => {
      const result = await deleteTextDoc(draft.id);
      if (!result.ok) setError(result.error);
    });
  };

  return (
    <div className="rounded-xl border border-line bg-panel/60 p-3">
      <div className="mb-2 flex items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Título do rascunho"
          className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-extrabold text-ink outline-none transition hover:border-line focus:border-brand focus:bg-white"
        />
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          title="Excluir rascunho"
          className="rounded-lg p-1.5 text-muted transition hover:bg-red-50 hover:text-red-500 disabled:opacity-60"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={8}
        placeholder="Escreva aqui..."
        className={`${inputCls} resize-y bg-white leading-relaxed`}
      />

      <ErrorBox message={error} />

      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-xl bg-gradient-to-r from-brand-violet to-brand-blue px-4 py-2 text-sm font-extrabold text-white shadow-card transition hover:brightness-105 disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Salvar"}
        </button>
        {saved && (
          <span className="text-sm font-extrabold text-emerald-600">
            Salvo ✓
          </span>
        )}
        <span className="ml-auto text-[11px] font-semibold text-muted">
          Atualizado em {formatDateTime(draft.updatedAt)}
        </span>
      </div>
    </div>
  );
}

export function DraftsSection({ drafts }: { drafts: TextDocDTO[] }) {
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const create = () => {
    if (!newTitle.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await createTextDoc(newTitle);
      if (result.ok) setNewTitle("");
      else setError(result.error);
    });
  };

  return (
    <section className="rounded-2xl bg-white p-4 shadow-card md:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink-soft">
          Pitch e rascunhos
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create();
          }}
          className="ml-auto flex gap-1.5"
        >
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Novo rascunho..."
            className={`${inputCls} w-44 py-1.5`}
          />
          <button
            type="submit"
            disabled={pending || !newTitle.trim()}
            aria-label="Criar rascunho"
            className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand text-white transition hover:brightness-105 disabled:opacity-40"
          >
            {pending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Plus size={16} strokeWidth={2.8} />
            )}
          </button>
        </form>
      </div>

      <ErrorBox message={error} />

      {drafts.length === 0 ? (
        <p className="py-6 text-center text-sm font-semibold text-muted">
          Nenhum rascunho ainda — crie um acima.
        </p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {drafts.map((draft) => (
            <DraftCard key={draft.id} draft={draft} />
          ))}
        </div>
      )}
    </section>
  );
}
