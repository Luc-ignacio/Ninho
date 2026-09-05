"use server";

import prisma from "@/lib/prisma";
import { getProfileByEmail } from "./profile";
import { SpaceRole } from "@/app/generated/prisma/enums";

export async function addSpaceMember(
  spaceId: string,
  email: string,
  role: SpaceRole,
) {
  const profile = await getProfileByEmail(email);

  if (!profile) {
    throw new Error("Perfil não encontrado");
  }

  return await prisma.$transaction(async (tx) => {
    const existingMember = await tx.spaceMember.findUnique({
      where: {
        spaceId_profileId: {
          spaceId,
          profileId: profile.id,
        },
      },
    });

    if (existingMember) {
      throw new Error("Esse perfil já faz parte desse espaço");
    }

    const spaceMember = await tx.spaceMember.create({
      data: {
        spaceId,
        profileId: profile.id,
        role,
      },
    });

    return spaceMember;
  });
}

export async function removeSpaceMember(spaceMemberId: string) {
  return await prisma.spaceMember.delete({
    where: {
      id: spaceMemberId,
    },
  });
}
