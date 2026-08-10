-- CreateEnum
CREATE TYPE "Section" AS ENUM ('NACIONAL', 'INTERNACIONAL');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('BAIXA', 'MEDIA', 'ALTA');

-- CreateEnum
CREATE TYPE "WorkModel" AS ENUM ('REMOTO', 'HIBRIDO', 'PRESENCIAL');

-- CreateEnum
CREATE TYPE "RejectionReason" AS ENUM ('SEM_RETORNO', 'PERFIL_NAO_ADERENTE', 'EXPERIENCIA', 'PRETENSAO_SALARIAL', 'IDIOMA', 'TESTE_TECNICO', 'ENTREVISTA', 'VAGA_ENCERRADA', 'VISTO_LOCALIZACAO', 'OUTRO');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('CREATED', 'STAGE_CHANGED', 'REJECTED', 'RESTORED', 'NOTE', 'EDITED', 'ARCHIVED', 'UNARCHIVED');

-- CreateTable
CREATE TABLE "stages" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "isRejection" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "section" "Section" NOT NULL,
    "stageId" TEXT NOT NULL,
    "position" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "company" TEXT NOT NULL,
    "roleTitle" TEXT NOT NULL,
    "jobUrl" TEXT,
    "platform" TEXT,
    "locationCity" TEXT,
    "workModel" "WorkModel",
    "countryCode" TEXT,
    "salary" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIA',
    "appliedAt" TIMESTAMP(3),
    "notes" TEXT,
    "rejectionReason" "RejectionReason",
    "rejectionNote" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedFromStageId" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_events" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "fromStageId" TEXT,
    "toStageId" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stages_key_key" ON "stages"("key");

-- CreateIndex
CREATE INDEX "applications_section_stageId_idx" ON "applications"("section", "stageId");

-- CreateIndex
CREATE INDEX "application_events_applicationId_createdAt_idx" ON "application_events"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "application_events_createdAt_idx" ON "application_events"("createdAt");

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_rejectedFromStageId_fkey" FOREIGN KEY ("rejectedFromStageId") REFERENCES "stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_events" ADD CONSTRAINT "application_events_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
