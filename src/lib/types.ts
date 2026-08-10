// Tipos serializáveis compartilhados entre server e client.
// Espelham os enums do Prisma sem importar @prisma/client no bundle do cliente.

export type Section = "NACIONAL" | "INTERNACIONAL";
export type SectionSlug = "nacional" | "internacional";
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
  section: Section;
  stageId: string;
  position: number;
  company: string;
  roleTitle: string;
  jobUrl: string | null;
  platform: string | null;
  locationCity: string | null;
  workModel: WorkModel | null;
  countryCode: string | null;
  salary: string | null;
  priority: Priority;
  appliedAt: Date | null;
  notes: string | null;
  rejectionReason: RejectionReason | null;
  rejectionNote: string | null;
  rejectedAt: Date | null;
  rejectedFromStageId: string | null;
  createdAt: Date;
  noteCount: number;
  stageEnteredAt: Date;
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
    section: Section;
    countryCode: string | null;
  };
}
