import { cache } from "react";
import { createClient } from "../supabase/server";
import prisma from "@/lib/prisma";

export const getActiveProfile = cache(async () => {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const profile = await prisma.profile.findUnique({
    where: {
      id: user.id,
    },
  });

  if (!profile) {
    return null;
  }

  return profile;
});
