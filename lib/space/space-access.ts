import { getActiveSpace } from "@/lib/space/get-active-space";

export async function requireSpace() {
  const space = await getActiveSpace();

  if (!space) {
    throw new Error("Espaço não encontrado");
  }

  return space;
}

export async function requireSpaceWriter() {
  const space = await requireSpace();

  if (!space.canManage) {
    throw new Error("Apenas administradores podem alterar esse espaço");
  }

  return space;
}

export async function requireSpaceOwner() {
  const space = await requireSpace();

  if (space.viewerRole !== "OWNER") {
    throw new Error("Apenas o dono do espaço pode fazer isso");
  }

  return space;
}
