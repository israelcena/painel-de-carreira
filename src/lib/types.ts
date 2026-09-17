// Tipos serializáveis compartilhados entre server e client.
// Espelham os enums do Prisma sem importar @prisma/client no bundle do cliente.

/** Recorte geográfico derivado do país: Brasil (countryCode BR) ou exterior. */
export type Origin = "BRASIL" | "EXTERIOR";
export type Priority = "BAIXA" | "MEDIA" | "ALTA";
export type WorkModel = "REMOTO" | "HIBRIDO" | "PRESENCIAL";

export type RejectionReason =
  | "SEM_RETORNO"
  | "PERFIL_NAO_ADERENTE"
  | "EXPERIENCIA"
  | "PRETENSAO_SALARIAL"
  | "IDIOMA"
  | "TESTE_TECNICO"
  | "ENTREVISTA"
  | "VAGA_ENCERRADA"
  | "VISTO_LOCALIZACAO"
  | "OUTRO";

export type EventType =
  | "CREATED"
  | "STAGE_CHANGED"
  | "REJECTED"
  | "RESTORED"
  | "NOTE"
  | "EDITED"
  | "ARCHIVED"
  | "UNARCHIVED";

export interface StageDTO {
  id: string;
  key: string;
  name: string;
  order: number;
  color: string;
  isRejection: boolean;
}

export interface AppCard {
  id: string;
  stageId: string;
  position: number;
  company: string;
  roleTitle: string;
  jobUrl: string | null;
  platform: string | null;
  locationCity: string | null;
  workModel: WorkModel | null;
  /** ISO-3166 alpha-2, sempre presente (BR para vagas no Brasil). */
  countryCode: string;
  salary: string | null;
  priority: Priority;
  appliedAt: Date | null;
  notes: string | null;
  jobDescription: string | null;
  applicationUrl: string | null;
  nextActionNote: string | null;
  nextActionAt: Date | null;
  rejectionReason: RejectionReason | null;
  rejectionNote: string | null;
  rejectedAt: Date | null;
  rejectedFromStageId: string | null;
  createdAt: Date;
  noteCount: number;
  stageEnteredAt: Date;
}

export type SwotQuadrant = "FORCA" | "FRAQUEZA" | "OPORTUNIDADE" | "AMEACA";

export interface SwotItemDTO {
  id: string;
  applicationId: string | null;
  quadrant: SwotQuadrant;
  text: string;
  createdAt: Date;
}

export interface DocumentDTO {
  id: string;
  name: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: Date;
}

export interface TextDocDTO {
  id: string;
  title: string;
  content: string;
  updatedAt: Date;
}

export interface EventDTO {
  id: string;
  type: EventType;
  fromStageId: string | null;
  toStageId: string | null;
  data: Record<string, unknown> | null;
  createdAt: Date;
}

export interface EventWithApp extends EventDTO {
  application: {
    id: string;
    company: string;
    roleTitle: string;
    countryCode: string;
  };
}
