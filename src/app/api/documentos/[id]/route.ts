import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(
  _request: Request,
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

  const encodedName = encodeURIComponent(doc.fileName);
  return new NextResponse(new Uint8Array(doc.data), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Length": String(doc.size),
      "Content-Disposition": `attachment; filename="${encodedName}"; filename*=UTF-8''${encodedName}`,
    },
  });
}
