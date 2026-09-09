"use server";

import prisma from "@/lib/prisma";
import { centsToDecimal, ymdToUtcDate } from "@/lib/utils";
import { AccountType, CurrencyType } from "../generated/prisma/enums";

interface AccountData {
  spaceId: string;
  profileId: string | null;
  name: string;
  type: AccountType;
  currency: CurrencyType;
  balanceCents: number;
  openingDate: string; // "YYYY-MM-DD"
}

export async function addSpaceAccount(accountData: AccountData) {
  if (!Number.isSafeInteger(accountData.balanceCents)) {
    throw new Error("Saldo inicial inválido");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(accountData.openingDate)) {
    throw new Error("Data de abertura inválida");
  }

  // O snapshot precisa da data *local* do usuário. Um `new Date()` aqui seria
  // truncado para a data UTC, então uma conta criada às 22h em BRT ficaria
  // datada de amanhã e o saldo derivado descartaria o primeiro dia de
  // transações.
  const openingDate = ymdToUtcDate(accountData.openingDate);

  if (
    Number.isNaN(openingDate.getTime()) ||
    openingDate.toISOString().slice(0, 10) !== accountData.openingDate
  ) {
    throw new Error("Data de abertura inválida");
  }

  return await prisma.$transaction(async (tx) => {
    const account = await tx.account.create({
      data: {
        spaceId: accountData.spaceId,
        profileId: accountData.profileId,
        name: accountData.name,
        type: accountData.type,
        currency: accountData.currency,
      },
    });

    await tx.accountBalanceSnapshot.create({
      data: {
        accountId: account.id,
        date: openingDate,
        balance: centsToDecimal(accountData.balanceCents),
      },
    });

    return account;
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
