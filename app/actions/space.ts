"use server";

import { getActiveProfile } from "@/lib/auth/get-active-profile";
import prisma from "@/lib/prisma";
import { ACTIVE_SPACE_COOKIE } from "@/lib/space/get-active-space";
import { getSpacesByProfile } from "@/lib/space/queries";
import { requireSpaceOwner, requireSpaceWriter } from "@/lib/space/space-access";
import { addTemplateCategories } from "@/lib/space/template-categories";
import { cookies } from "next/headers";

export async function createSpace(name: string) {
  return await prisma.$transaction(async (tx) => {
    const profile = await getActiveProfile();

    if (!profile) {
      throw new Error("Perfil não encontrado");
    }

    const existing = await tx.space.findFirst({
      where: {
        name,
        Members: {
          some: {
            profileId: profile.id,
          },
        },
      },
    });

    if (existing) {
      throw new Error("Você já tem um espaço com esse nome.");
    }

    const space = await tx.space.create({
      data: {
        name,
      },
    });

    // Add Space Owner
    await tx.spaceMember.create({
      data: {
        spaceId: space.id,
        profileId: profile.id,
        role: "OWNER",
      },
    });

    // Add TemplateCategories
    await addTemplateCategories(tx, space.id);

    return space;
  });
}

export async function hasAnySpace() {
  const spaces = await getSpacesByProfile();
  return spaces.length > 0;
}

export async function setActiveSpace(spaceId: string) {
  const profile = await getActiveProfile();
  if (!profile) throw new Error("Perfil não encontrado");

  const membership = await prisma.spaceMember.findUnique({
    where: { spaceId_profileId: { spaceId, profileId: profile.id } },
  });
  if (!membership) throw new Error("Espaço não encontrado");

  (await cookies()).set(ACTIVE_SPACE_COOKIE, spaceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function deleteSpace(spaceId: string) {
  const space = await requireSpaceOwner();

  if (space.id !== spaceId) {
    throw new Error("Espaço não encontrado");
  }

  return await prisma.space.delete({
    where: {
      id: space.id,
    },
  });
}

export async function renameSpace(name: string) {
  const space = await requireSpaceWriter();

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.space.findFirst({
      where: {
        name,
        id: {
          not: space.id,
        },
        Members: {
          some: {
            profileId: space.viewerProfileId,
          },
        },
      },
    });

    if (existing) {
      throw new Error("Você já tem um espaço com esse nome.");
    }

    return await tx.space.update({
      where: {
        id: space.id,
      },
      data: {
        name,
      },
    });
  });
}
