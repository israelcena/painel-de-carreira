import type {
  Origin,
  Priority,
  RejectionReason,
  SwotQuadrant,
  WorkModel,
} from "./types";

/** Rótulos do recorte Brasil × exterior (derivado de countryCode === "BR"). */
export const ORIGIN_LABELS: Record<Origin, string> = {
  BRASIL: "Brasil",
  EXTERIOR: "Exterior",
};

/** Código ISO do Brasil — base da distinção Brasil × exterior. */
export const BRAZIL_CODE = "BR";

// Cor da série do gráfico mensal (roxo da marca). Contraste no branco fica
// abaixo de 3:1, então o gráfico mantém rótulos de valor visíveis nas barras.
export const CHART_SERIES_COLOR = "#6a5cd8";

export const PRIORITY_LABELS: Record<Priority, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
};

// Cores das pills seguindo a referência visual (Low azul, Med teal, High rosa)
export const PRIORITY_COLORS: Record<Priority, string> = {
  BAIXA: "#5b7df5",
  MEDIA: "#2fbfa4",
  ALTA: "#f0509e",
};

export const PRIORITY_ORDER: Priority[] = ["BAIXA", "MEDIA", "ALTA"];

export const WORK_MODEL_LABELS: Record<WorkModel, string> = {
  REMOTO: "Remoto",
  HIBRIDO: "Híbrido",
  PRESENCIAL: "Presencial",
};

export const REJECTION_REASON_LABELS: Record<RejectionReason, string> = {
  SEM_RETORNO: "Sem retorno (ghosting)",
  PERFIL_NAO_ADERENTE: "Perfil não aderente à vaga",
  EXPERIENCIA: "Experiência insuficiente",
  PRETENSAO_SALARIAL: "Pretensão salarial",
  IDIOMA: "Idioma",
  TESTE_TECNICO: "Reprovação no teste técnico",
  ENTREVISTA: "Reprovação na entrevista",
  VAGA_ENCERRADA: "Vaga cancelada/congelada",
  VISTO_LOCALIZACAO: "Visto/Localização",
  OUTRO: "Outro",
};

export const REJECTION_REASON_ORDER: RejectionReason[] = [
  "SEM_RETORNO",
  "PERFIL_NAO_ADERENTE",
  "EXPERIENCIA",
  "PRETENSAO_SALARIAL",
  "IDIOMA",
  "TESTE_TECNICO",
  "ENTREVISTA",
  "VAGA_ENCERRADA",
  "VISTO_LOCALIZACAO",
  "OUTRO",
];

export const SWOT_ORDER: SwotQuadrant[] = [
  "FORCA",
  "FRAQUEZA",
  "OPORTUNIDADE",
  "AMEACA",
];

// Cores semânticas dos quadrantes (identidade sempre pelo título; cor é reforço)
export const SWOT_CONFIG: Record<
  SwotQuadrant,
  { label: string; color: string; hint: string }
> = {
  FORCA: {
    label: "Forças",
    color: "#10b981",
    hint: "Interno · o que joga a seu favor",
  },
  FRAQUEZA: {
    label: "Fraquezas",
    color: "#ef4444",
    hint: "Interno · gaps e pontos a desenvolver",
  },
  OPORTUNIDADE: {
    label: "Oportunidades",
    color: "#3b82f6",
    hint: "Externo · fatores do mercado a favor",
  },
  AMEACA: {
    label: "Ameaças",
    color: "#f59e0b",
    hint: "Externo · riscos e concorrência",
  },
};

// Currículos (Documentos e aba Currículo da vaga). Compartilhado com o cliente
// para o `accept` dos inputs e a checagem de tamanho antes do envio.
export const DOCUMENT_MAX_BYTES = 8 * 1024 * 1024; // 8 MB
export const DOCUMENT_TOO_LARGE = "Arquivo muito grande (máx. 8 MB).";
export const DOCUMENT_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".odt",
  ".rtf",
  ".txt",
  ".md",
];

/**
 * Como o visualizador do card mostra o arquivo: PDF no leitor do navegador,
 * texto dentro do modal; `null` para formatos que o navegador não abre (DOC,
 * DOCX, ODT, RTF), que ficam só com o download. Decide pela extensão, não pelo
 * mimeType salvo (que vem do navegador de quem enviou).
 */
export type DocumentPreviewKind = "pdf" | "text";

export function documentPreviewKind(
  fileName: string
): DocumentPreviewKind | null {
  const dot = fileName.lastIndexOf(".");
  const ext = dot >= 0 ? fileName.slice(dot).toLowerCase() : "";
  if (ext === ".pdf") return "pdf";
  if (ext === ".txt" || ext === ".md") return "text";
  return null;
}

export const PLATFORM_SUGGESTIONS = [
  "LinkedIn",
  "Gupy",
  "Indeed",
  "Glassdoor",
  "Vagas.com",
  "Site da empresa",
  "Indicação",
  "Wellfound",
  "RemoteOK",
  "Outro",
];
