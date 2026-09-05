import { cache } from "react";
import { cookies } from "next/headers";
import { getSpaceById, getSpacesByProfile } from "@/lib/space/queries";

export type ActiveSpace = Awaited<ReturnType<typeof getActiveSpace>>;

export const ACTIVE_SPACE_COOKIE = "active-space";

export const getActiveSpace = cache(async () => {
  const spaces = await getSpacesByProfile();
  if (spaces.length === 0) return null;

  const selectedId = (await cookies()).get(ACTIVE_SPACE_COOKIE)?.value;

  const activeSpace = spaces.find((s) => s.id === selectedId) ?? spaces[0];

  const activeSpaceWithDetails = await getSpaceById(activeSpace.id);

  return activeSpaceWithDetails;
});
