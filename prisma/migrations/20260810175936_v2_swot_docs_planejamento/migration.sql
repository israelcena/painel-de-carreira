-- CreateEnum
CREATE TYPE "SwotQuadrant" AS ENUM ('FORCA', 'FRAQUEZA', 'OPORTUNIDADE', 'AMEACA');

-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "applicationUrl" TEXT,
ADD COLUMN     "jobDescription" TEXT,
ADD COLUMN     "nextActionAt" TIMESTAMP(3),
ADD COLUMN     "nextActionNote" TEXT;

-- CreateTable
CREATE TABLE "swot_items" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT,
    "quadrant" "SwotQuadrant" NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "swot_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "text_docs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "text_docs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "swot_items_applicationId_quadrant_idx" ON "swot_items"("applicationId", "quadrant");

-- AddForeignKey
ALTER TABLE "swot_items" ADD CONSTRAINT "swot_items_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
