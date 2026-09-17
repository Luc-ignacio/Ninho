"use server";

import { SpaceRole } from "@/app/generated/prisma/enums";
import { getActiveProfile } from "@/lib/auth/get-active-profile";
import { getProfileByEmail } from "@/lib/auth/get-profile-by-email";
import prisma from "@/lib/prisma";

async function requireSpaceManager(spaceId: string) {
  const profile = await getActiveProfile();

  if (!profile) {
    throw new Error("Perfil não encontrado");
  }

  const membership = await prisma.spaceMember.findUnique({
    where: {
      spaceId_profileId: {
        spaceId,
        profileId: profile.id,
      },
    },
    select: {
      role: true,
    },
  });

  if (!membership || membership.role === "MEMBER") {
    throw new Error("Você não pode gerenciar os membros desse espaço");
  }

  return membership;
}

export async function addSpaceMember(
  spaceId: string,
  email: string,
  role: SpaceRole,
) {
  const manager = await requireSpaceManager(spaceId);

  if (role === "OWNER" && manager.role !== "OWNER") {
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
  const spaceMember = await prisma.spaceMember.findUnique({
    where: {
      id: spaceMemberId,
    },
    select: {
      spaceId: true,
      role: true,
    },
  });

  if (!spaceMember) {
    throw new Error("Membro não encontrado");
  }

  const manager = await requireSpaceManager(spaceMember.spaceId);

  if (spaceMember.role === "OWNER" && manager.role !== "OWNER") {
    throw new Error("Apenas o dono do espaço pode remover outro dono");
  }

  return await prisma.spaceMember.delete({
    where: {
      id: spaceMemberId,
    },
  });
}
