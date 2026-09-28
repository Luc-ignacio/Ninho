import { cache } from "react";
import { cookies } from "next/headers";
import { getActiveProfile } from "@/lib/auth/get-active-profile";
import { getSpaceById, getSpacesByProfile } from "@/lib/space/queries";

export type ActiveSpace = Awaited<ReturnType<typeof getActiveSpace>>;

export const ACTIVE_SPACE_COOKIE = "active-space";

export const getActiveSpace = cache(async () => {
  const profile = await getActiveProfile();
  if (!profile) return null;

  const spaces = await getSpacesByProfile();
  if (spaces.length === 0) return null;

  const selectedId = (await cookies()).get(ACTIVE_SPACE_COOKIE)?.value;

  const activeSpace = spaces.find((s) => s.id === selectedId) ?? spaces[0];

  const activeSpaceWithDetails = await getSpaceById(activeSpace.id);
  if (!activeSpaceWithDetails) return null;

  const viewerMembership = activeSpaceWithDetails.Members.find(
    (member) => member.Profile.id === profile.id,
  );
  if (!viewerMembership) return null;

  return {
    ...activeSpaceWithDetails,
    viewerProfileId: profile.id,
    viewerRole: viewerMembership.role,
    canManage:
      viewerMembership.role === "OWNER" || viewerMembership.role === "ADMIN",
  };
});
