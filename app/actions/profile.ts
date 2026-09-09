"use server";

import prisma from "@/lib/prisma";
import { validateEmail } from "@/lib/utils";

interface ProfileData {
  id: string;
  name: string;
  email: string;
}

export async function upsertProfile(profileData: ProfileData) {
  return await prisma.profile.upsert({
    where: {
      id: profileData.id,
      email: profileData.email,
    },
    update: {},
    create: {
      id: profileData.id,
      name: profileData.name,
      email: profileData.email,
    },
  });
}

export async function getProfileByEmail(email: string) {
  const isEmailValid = validateEmail(email);

  if (isEmailValid) {
    const profile = await prisma.profile.findUnique({
      where: {
        email,
      },
    });

    if (!profile) {
      throw new Error("Perfil não encontrado");
    }

    return profile;
  }
}
