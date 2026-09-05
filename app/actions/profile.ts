"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
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

export async function getProfileSpaces() {
  const supabase = await createClient();

  const getUserId = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Perfil não encontrado");
    }

    return user.id;
  };

  const userId = await getUserId();

  return await prisma.profile.findUnique({
    where: {
      id: userId,
    },
    select: {
      Spaces: {
        select: {
          Space: true,
        },
      },
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
