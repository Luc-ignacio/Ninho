"use server";

import { upsertActiveProfile } from "@/lib/auth/upsert-active-profile";

export async function upsertProfile() {
  return await upsertActiveProfile();
}
