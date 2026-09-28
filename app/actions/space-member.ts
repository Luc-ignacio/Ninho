"use server";

import { SpaceRole } from "@/app/generated/prisma/enums";
import { getProfileByEmail } from "@/lib/auth/get-profile-by-email";
import prisma from "@/lib/prisma";
import { requireSpace, requireSpaceWriter } from "@/lib/space/space-access";

export async function addSpaceMember(
  spaceId: string,
  email: string,
  role: SpaceRole,
) {
  const space = await requireSpaceWriter();

  if (space.id !== spaceId) {
    throw new Error("Espaço não encontrado");
  }

  if (role === "OWNER" && space.viewerRole !== "OWNER") {
    throw new Error("Apenas o dono do espaço pode adicionar outro dono");
  }

  const profile = await getProfileByEmail(email);

  if (!profile) {
    throw new Error("Perfil não encontrado");
  }

  return await prisma.$transaction(async (tx) => {
    const existingMember = await tx.spaceMember.findUnique({
      where: {
        spaceId_profileId: {
          spaceId: space.id,
          profileId: profile.id,
        },
      },
    });

    if (existingMember) {
      throw new Error("Esse perfil já faz parte desse espaço");
    }

    const spaceMember = await tx.spaceMember.create({
      data: {
        spaceId: space.id,
        profileId: profile.id,
        role,
      },
    });

    return spaceMember;
  });
}

export async function removeSpaceMember(spaceMemberId: string) {
  const space = await requireSpace();

  const spaceMember = space.Members.find(
    (member) => member.id === spaceMemberId,
  );

  if (!spaceMember) {
    throw new Error("Membro não encontrado");
  }

  const isSelf = spaceMember.Profile.id === space.viewerProfileId;

  if (spaceMember.role === "OWNER") {
    if (isSelf) {
      throw new Error("O dono não pode sair do próprio espaço");
    }

    if (space.viewerRole !== "OWNER") {
      throw new Error("Apenas o dono do espaço pode remover outro dono");
    }
  } else if (!isSelf && !space.canManage) {
    throw new Error("Você não pode gerenciar os membros desse espaço");
  }

  return await prisma.spaceMember.delete({
    where: {
      id: spaceMember.id,
    },
  });
}
