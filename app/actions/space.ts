"use server";

import { getActiveProfile } from "@/lib/auth/get-active-profile";
import prisma from "@/lib/prisma";
import { ACTIVE_SPACE_COOKIE } from "@/lib/space/get-active-space";
import { getSpacesByProfile } from "@/lib/space/queries";
import { cookies } from "next/headers";
import { addTemplateCategories } from "./category";

export async function createSpace(name: string) {
  return await prisma.$transaction(async (tx) => {
    const profile = await getActiveProfile();

    if (!profile) {
      throw new Error("Perfil não encontrado");
    }

    const existing = await tx.space.findFirst({
      where: {
        name,
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
  const profile = await getActiveProfile();
  if (!profile) throw new Error("Perfil não encontrado");

  return await prisma.$transaction(async (tx) => {
    const isOwner = await tx.spaceMember.findUnique({
      where: {
        spaceId_profileId: {
          spaceId,
          profileId: profile.id,
        },
        role: "OWNER",
      },
    });

    if (!isOwner) {
      throw new Error("Only the owner can delete a space.");
    }

    return await tx.space.delete({
      where: {
        id: spaceId,
      },
    });
  });
}

export async function renameSpace(spaceId: string, name: string) {
  return await prisma.$transaction(async (tx) => {
    const profile = await getActiveProfile();

    if (!profile) {
      throw new Error("Perfil não encontrado");
    }

    const existing = await tx.space.findFirst({
      where: {
        name,
      },
    });

    if (existing) {
      throw new Error("Você já tem um espaço com esse nome.");
    }

    const space = await tx.space.update({
      where: {
        id: spaceId,
      },
      data: {
        name,
      },
    });

    return space;
  });
}
