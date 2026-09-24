import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { documentPreviewKind } from "@/lib/domain";
import { getSession } from "@/lib/session";

const PREVIEW_CONTENT_TYPES = {
  pdf: "application/pdf",
  text: "text/plain; charset=utf-8",
} as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.loggedIn) {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) {
    return new NextResponse("Documento não encontrado", { status: 404 });
  }

  // `?inline=1`: pré-visualização do card. Só PDF e texto abrem no navegador,
  // com o tipo derivado da extensão; o resto continua baixando como anexo.
  const previewKind = request.nextUrl.searchParams.has("inline")
    ? documentPreviewKind(doc.fileName)
    : null;

  const encodedName = encodeURIComponent(doc.fileName);
  return new NextResponse(new Uint8Array(doc.data), {
    headers: {
      "Content-Type": previewKind
        ? PREVIEW_CONTENT_TYPES[previewKind]
        : doc.mimeType,
      "Content-Length": String(doc.size),
      "Content-Disposition": `${previewKind ? "inline" : "attachment"}; filename="${encodedName}"; filename*=UTF-8''${encodedName}`,
      "X-Content-Type-Options": "nosniff",
      // Currículo é dado pessoal: nada de guardar em cache no disco
      "Cache-Control": "private, no-store",
    },
  });
}
