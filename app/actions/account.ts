"use server";

import prisma from "@/lib/prisma";
import { getActiveSpace } from "@/lib/space/get-active-space";
import { centsToDecimal, ymdToUtcDate } from "@/lib/utils";
import { AccountType, CurrencyType } from "../generated/prisma/enums";

interface AccountData {
  spaceId: string;
  profileId: string | null;
  name: string;
  type: AccountType;
  currency: CurrencyType;
}

export async function addSpaceAccount(accountData: AccountData) {
  return await prisma.account.create({
    data: {
      spaceId: accountData.spaceId,
      profileId: accountData.profileId,
      name: accountData.name,
      type: accountData.type,
      currency: accountData.currency,
    },
  });
}

export async function deleteSpaceAccount(spaceId: string, accountId: string) {
  return await prisma.account.delete({
    where: {
      id: accountId,
      spaceId,
    },
  });
}

async function requireSpaceAccount(accountId: string) {
  const space = await getActiveSpace();

  if (!space) {
    throw new Error("Espaço não encontrado");
  }

  const account = await prisma.account.findFirst({
    where: { id: accountId, spaceId: space.id },
    select: { id: true },
  });

  if (!account) {
    throw new Error("Conta não encontrada nesse espaço");
  }

  return { space, account };
}

interface AccountBalanceData {
  accountId: string;
  balanceCents: number;
  ymd: string;
}

export async function setSpaceAccountBalance(data: AccountBalanceData) {
  const { account } = await requireSpaceAccount(data.accountId);

  if (!Number.isSafeInteger(data.balanceCents) || data.balanceCents < 0) {
    throw new Error("Saldo inválido");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.ymd)) {
    throw new Error("Data inválida");
  }

  const date = ymdToUtcDate(data.ymd);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== data.ymd
  ) {
    throw new Error("Data inválida");
  }

  // Um snapshot no futuro congelaria o saldo: nada seria posterior a ele. O dia
  // de folga é o fuso do cliente, que às 21h em BRT já está um dia atrás do UTC.
  const limit = new Date();
  limit.setUTCDate(limit.getUTCDate() + 1);

  if (date.toISOString().slice(0, 10) > limit.toISOString().slice(0, 10)) {
    throw new Error("A data do saldo não pode estar no futuro");
  }

  const balance = centsToDecimal(data.balanceCents);

  return await prisma.accountBalanceSnapshot.upsert({
    where: { accountId_date: { accountId: account.id, date } },
    create: { accountId: account.id, date, balance },
    update: { balance },
    select: { id: true },
  });
}

export async function deleteSpaceAccountBalance(
  accountId: string,
  snapshotId: string,
) {
  const { account } = await requireSpaceAccount(accountId);

  const { count } = await prisma.accountBalanceSnapshot.deleteMany({
    where: { id: snapshotId, accountId: account.id },
  });

  if (count === 0) {
    throw new Error("Saldo registrado não encontrado");
  }
}
