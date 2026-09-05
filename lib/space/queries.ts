import { cache } from "react";

import { getActiveProfile } from "@/lib/auth/get-active-profile";
import prisma from "@/lib/prisma";

export type ProfileSpace = Awaited<
  ReturnType<typeof getSpacesByProfile>
>[number];

export type SpaceCategory = Awaited<
  ReturnType<typeof getSpaceCategories>
>[number];

export type SpaceMember = Awaited<
  NonNullable<Awaited<ReturnType<typeof getSpaceById>>>
>["Members"][number];

export const getSpacesByProfile = cache(async () => {
  const profile = await getActiveProfile();

  if (!profile) {
    throw new Error("Perfil não encontrado");
  }

  return await prisma.space.findMany({
    where: {
      Members: {
        some: {
          profileId: profile.id,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
});

export const getSpaceById = cache(async (id: string) => {
  return await prisma.space.findUnique({
    where: {
      id,
    },
    include: {
      Members: {
        select: {
          id: true,
          role: true,
          joinedAt: true,
          Profile: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          joinedAt: "asc",
        },
      },
      Categories: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
});

export const getSpaceCategories = cache(async (spaceId: string) => {
  return await prisma.category.findMany({
    where: {
      spaceId,
    },
    include: {
      _count: {
        select: {
          Transactions: true,
        },
      },
    },
  });
});

export const getSpaceMembers = cache(async (spaceId: string) => {
  return await prisma.spaceMember.findMany({
    where: {
      spaceId,
    },
    include: {
      Profile: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
});
