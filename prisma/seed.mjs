import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const STAGES = [
  { key: "interesse", name: "Interesse", order: 1, color: "#8b5cf6", isRejection: false },
  { key: "aplicado", name: "Aplicado", order: 2, color: "#3b82f6", isRejection: false },
  { key: "contato", name: "Contato/Screening", order: 3, color: "#06b6d4", isRejection: false },
  { key: "entrevista", name: "Entrevista", order: 4, color: "#f59e0b", isRejection: false },
  { key: "teste-tecnico", name: "Teste Técnico", order: 5, color: "#ec4899", isRejection: false },
  { key: "oferta", name: "Oferta", order: 6, color: "#10b981", isRejection: false },
  { key: "rejeitado", name: "Rejeitado", order: 7, color: "#ef4444", isRejection: true },
];

try {
  for (const stage of STAGES) {
    await prisma.stage.upsert({
      where: { key: stage.key },
      update: {
        name: stage.name,
        order: stage.order,
        color: stage.color,
        isRejection: stage.isRejection,
      },
      create: stage,
    });
  }

  // Rascunho inicial de pitch (só se ainda não existir nenhum texto)
  const textCount = await prisma.textDoc.count();
  if (textCount === 0) {
    await prisma.textDoc.create({
      data: {
        title: "Meu Pitch",
        content:
          "Quem sou eu:\n\nO que eu faço de melhor:\n\nO que estou buscando:\n\nPor que me contratar:\n",
      },
    });
  }

  console.log(
    `Seed ok: ${STAGES.length} etapas garantidas${textCount === 0 ? " + pitch inicial criado" : ""}.`
  );
} finally {
  await prisma.$disconnect();
}
