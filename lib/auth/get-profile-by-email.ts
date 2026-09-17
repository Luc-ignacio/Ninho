import prisma from "@/lib/prisma";
import { validateEmail } from "@/lib/utils";

export async function getProfileByEmail(email: string) {
  if (!validateEmail(email)) {
    return null;
  }

  return prisma.profile.findUnique({
    where: {
      email,
    },
  });
}
