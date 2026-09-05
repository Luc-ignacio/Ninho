"use server";

import prisma from "@/lib/prisma";
import { AccountType, CurrencyType } from "../generated/prisma/enums";

interface AccountData {
  spaceId: string;
  profileId: string | null;
  name: string;
  type: AccountType;
  currency: CurrencyType;
  balance: number;
}

export async function addSpaceAccount(accountData: AccountData) {
  return await prisma.$transaction(async (tx) => {
    const account = await tx.account.create({
      data: {
        spaceId: accountData.spaceId,
        profileId: accountData.profileId ?? null,
        name: accountData.name,
        type: accountData.type,
        currency: accountData.currency,
      },
    });

    await tx.accountBalanceSnapshot.create({
      data: {
        accountId: account.id,
        date: new Date(),
        balance: accountData.balance,
      },
    });

    return account;
  });
}

export async function getAccountsBySpaceId(spaceId: string) {
  return await prisma.account.findMany({
    where: {
      spaceId,
    },
  });
}
