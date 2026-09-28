import { Prisma } from "@/app/generated/prisma/client";

const templateCategories = [
  "Renda",
  "Moradia",
  "Mercado",
  "Restaurantes",
  "Transporte",
  "Compras",
  "Lazer",
  "Educação",
  "Saúde",
  "Investimentos",
  "Outros",
];

export async function addTemplateCategories(
  tx: Prisma.TransactionClient,
  spaceId: string,
) {
  return await tx.category.createMany({
    data: templateCategories.map((name) => ({ spaceId, name })),
    skipDuplicates: true,
  });
}
