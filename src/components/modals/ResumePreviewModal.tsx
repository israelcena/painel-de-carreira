"use client";

import { Download, ExternalLink, FileUser, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { documentPreviewKind } from "@/lib/domain";
import { formatBytes } from "@/lib/format";
import type { AppCard } from "@/lib/types";
import { ErrorBox } from "@/components/ui/fields";
import { Modal } from "@/components/ui/Modal";

const SESSION_EXPIRED =
  "Sua sessão expirou. Recarregue a página para entrar de novo.";

/**
 * UTF-16 quando há BOM (o "Unicode" do Bloco de Notas); senão UTF-8 quando o
 * arquivo é válido nele; senão Windows-1252 (TXT antigo do Windows).
 */
function decodeText(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(buffer);
  }
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(buffer);
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1252").decode(buffer);
  }
}

/**
 * PDF dentro do modal só com leitor embutido (o Chrome do Android não tem) e
 * ponteiro fino: no iPhone/iPad o WebKit desenha PDF em iframe como imagem da
 * 1ª página, e lá o ponteiro é sempre grosso, mesmo com trackpad.
 */
function canEmbedPdf(): boolean {
  if (typeof window === "undefined") return true;
  return (
    navigator.pdfViewerEnabled !== false &&
    window.matchMedia("(pointer: fine)").matches
  );
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-line px-4 py-8 text-center">
      <div>
        <span className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-brand/10 text-brand">
          <FileUser size={20} strokeWidth={2.2} />
        </span>
        <p className="text-sm font-semibold text-ink-soft">{children}</p>
      </div>
    </div>
  );
}

function PdfPreview({ url, title }: { url: string; title: string }) {
  const [loaded, setLoaded] = useState(false);
  const [expired, setExpired] = useState(false);

  if (expired) return <ErrorBox message={SESSION_EXPIRED} />;
  return (
    <div className="relative h-[70dvh] overflow-hidden rounded-xl border border-line bg-panel">
      {/* Atrás do iframe: some quando o leitor pinta, mesmo sem o evento load */}
      {!loaded && (
        <div className="absolute inset-0 grid place-items-center text-muted">
          <Loader2 size={22} className="animate-spin" />
        </div>
      )}
      <iframe
        src={`${url}#view=FitH`}
        title={title}
        onLoad={(e) => {
          setLoaded(true);
          // Sem sessão o proxy redireciona para /login, que abriria no iframe
          try {
            const { pathname } = e.currentTarget.contentWindow?.location ?? {};
            if (pathname === "/login") setExpired(true);
          } catch {
            // Documento de outra origem (leitor do navegador): nada a checar
          }
        }}
        className="relative size-full"
      />
    </div>
  );
}

function TextPreview({ url }: { url: string }) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        // Sem sessão o proxy redireciona para /login (200, HTML)
        if (res.redirected) {
          setError(SESSION_EXPIRED);
          return;
        }
        setText(decodeText(await res.arrayBuffer()));
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError("Não foi possível carregar o arquivo.");
        }
      });
    return () => controller.abort();
  }, [url]);

  if (error) return <ErrorBox message={error} />;
  if (text === null) {
    return (
      <div className="grid min-h-48 place-items-center text-muted">
        <Loader2 size={22} className="animate-spin" />
      </div>
    );
  }
  return (
    <pre className="nice-scroll max-h-[70dvh] overflow-auto whitespace-pre-wrap wrap-break-word rounded-xl border border-line bg-panel p-4 font-mono text-xs leading-relaxed text-ink">
      {text}
    </pre>
  );
}

/** Pré-visualização do currículo vinculado à vaga, aberta pelo ícone do card. */
export function ResumePreviewModal({
  app,
  onClose,
}: {
  app: AppCard | null;
  onClose: () => void;
}) {
  const resume = app?.resume;
  if (!app || !resume) return null;

  const downloadUrl = `/api/documentos/${resume.id}`;
  const inlineUrl = `${downloadUrl}?inline=1`;
  const kind = documentPreviewKind(resume.fileName);
  const pdfInline = kind === "pdf" && canEmbedPdf();
  // O upload só aceita nomes com extensão (DOCUMENT_EXTENSIONS)
  const ext = resume.fileName
    .slice(resume.fileName.lastIndexOf(".") + 1)
    .toUpperCase();

  return (
    <Modal
      open
      onClose={onClose}
      wide
      title={resume.name}
      subtitle={`${app.company} — ${app.roleTitle}`}
    >
      {/* min-w-48: sem espaço para o nome, os botões descem para a linha de baixo */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p
          className="min-w-48 flex-1 truncate text-xs font-semibold text-muted"
          title={resume.fileName}
        >
          {resume.fileName} · {formatBytes(resume.size)}
        </p>
        <div className="ml-auto flex items-center gap-2">
          {kind === "pdf" && (
            <a
              href={inlineUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-panel px-3 py-1.5 text-xs font-extrabold text-ink-soft transition hover:bg-brand/10 hover:text-brand"
            >
              <ExternalLink size={13} strokeWidth={2.5} /> Abrir em nova aba
            </a>
          )}
          <a
            href={downloadUrl}
            download={resume.fileName}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-violet to-brand-blue px-3 py-1.5 text-xs font-extrabold text-white shadow-card transition hover:brightness-105"
          >
            <Download size={13} strokeWidth={2.5} /> Baixar
          </a>
        </div>
      </div>

      {/* Foco inicial na pré-visualização, não no Baixar: um Enter segurado no
          ícone do card não pode disparar o download */}
      <div tabIndex={-1} data-autofocus className="outline-none">
        {pdfInline ? (
          <PdfPreview
            key={resume.id}
            url={inlineUrl}
            title={`Pré-visualização de ${resume.fileName}`}
          />
        ) : kind === "pdf" ? (
          <Placeholder>
            A pré-visualização de PDF não funciona neste navegador. Use{" "}
            <strong className="font-extrabold text-ink">
              Abrir em nova aba
            </strong>{" "}
            ou <strong className="font-extrabold text-ink">Baixar</strong>.
          </Placeholder>
        ) : kind === "text" ? (
          <TextPreview key={resume.id} url={inlineUrl} />
        ) : (
          <Placeholder>
            O navegador não abre arquivos {ext} para pré-visualizar.{" "}
            <strong className="font-extrabold text-ink">Baixe</strong> para
            abrir no seu editor.
          </Placeholder>
        )}
      </div>
    </Modal>
  );
}
