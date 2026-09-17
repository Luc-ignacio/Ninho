import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function upsertActiveProfile() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    return null;
  }

  const metadataName = user.user_metadata?.name;
  const name =
    typeof metadataName === "string" && metadataName.trim()
      ? metadataName.trim()
      : user.email;

  return prisma.profile.upsert({
    where: {
      id: user.id,
    },
    update: {},
    create: {
      id: user.id,
      name,
      email: user.email,
    },
  });
}
