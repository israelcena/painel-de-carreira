-- Currículo por vaga: cada candidatura aponta para uma versão da biblioteca
-- de Documentos. Aditiva (coluna nula); excluir o documento só desvincula.

-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "resumeId" TEXT;

-- CreateIndex
CREATE INDEX "applications_resumeId_idx" ON "applications"("resumeId");

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
