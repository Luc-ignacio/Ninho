"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "../generated/prisma/client";

const templateCategories = [
  "Moradia",
  "Mercado",
  "Restaurantes",
  "Transporte",
  "Compras",
  "Lazer",
  "Educação",
  "Saúde",
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

export async function addSpaceCategory(spaceId: string, name: string) {
  return await prisma.$transaction(async (tx) => {
    const existing = await tx.category.findUnique({
      where: {
        spaceId_name: {
          spaceId,
          name,
        },
      },
    });

    if (existing) {
      throw new Error("Já existe uma categoria com esse nome nesse espaço.");
    }

    return await tx.category.create({
      data: {
        spaceId,
        name,
      },
    });
  });
}

export async function deleteSpaceCategory(spaceId: string, categoryId: string) {
  return await prisma.category.delete({
    where: {
      id: categoryId,
      spaceId,
    },
  });
}
