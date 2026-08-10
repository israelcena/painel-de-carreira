import type {
  Priority,
  RejectionReason,
  Section,
  SectionSlug,
  SwotQuadrant,
  WorkModel,
} from "./types";

export const SECTION_LABELS: Record<Section, string> = {
  NACIONAL: "Nacional",
  INTERNACIONAL: "Internacional",
};

export const SECTION_BY_SLUG: Record<SectionSlug, Section> = {
  nacional: "NACIONAL",
  internacional: "INTERNACIONAL",
};

export const SLUG_BY_SECTION: Record<Section, SectionSlug> = {
  NACIONAL: "nacional",
  INTERNACIONAL: "internacional",
};

// Cores das séries do dashboard — par validado (CVD ΔE 16,1; deutan/tritan OK).
// O azul fica abaixo de 3:1 no branco: gráficos que o usam trazem rótulos visíveis.
export const SECTION_COLORS: Record<Section, string> = {
  NACIONAL: "#6a5cd8",
  INTERNACIONAL: "#57a5f5",
};

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
