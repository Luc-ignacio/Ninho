"use server";

import prisma from "@/lib/prisma";
import { requireSpaceWriter } from "@/lib/space/space-access";

export async function addSpaceCategory(name: string) {
  const space = await requireSpaceWriter();

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.category.findUnique({
      where: {
        spaceId_name: {
          spaceId: space.id,
          name,
        },
      },
    });

    if (existing) {
      throw new Error("Já existe uma categoria com esse nome nesse espaço.");
    }

    return await tx.category.create({
      data: {
        spaceId: space.id,
        name,
      },
    });
  });
}

export async function deleteSpaceCategory(categoryId: string) {
  const space = await requireSpaceWriter();

  return await prisma.category.delete({
    where: {
      id: categoryId,
      spaceId: space.id,
    },
  });
}
