"use server";

import prisma from "@/lib/prisma";
import { getActiveSpace } from "@/lib/space/get-active-space";
import { centsToDecimal } from "@/lib/utils";

interface CreditCardData {
  name: string;
  lastFour: string | null;
  creditLimitCents: number | null;
  dueDay: number | null;
  holderId: string | null;
  accountId: string | null;
}

function validateDay(day: number | null, label: string) {
  if (day === null) return null;

  if (!Number.isInteger(day) || day < 1 || day > 31) {
    throw new Error(`${label} inválido`);
  }

  return day;
}

function validateCreditCardData(
  creditCardData: CreditCardData,
  memberIds: Set<string>,
  accountById: Map<string, { isActive: boolean }>,
) {
  const name = creditCardData.name.trim();

  if (!name) {
    throw new Error("Informe o nome do cartão");
  }

  const lastFour = creditCardData.lastFour?.trim() || null;

  if (lastFour !== null && !/^\d{4}$/.test(lastFour)) {
    throw new Error("Os últimos quatro dígitos devem ter 4 números");
  }

  const { creditLimitCents } = creditCardData;

  if (
    creditLimitCents !== null &&
    (!Number.isSafeInteger(creditLimitCents) || creditLimitCents <= 0)
  ) {
    throw new Error("Limite inválido");
  }

  const dueDay = validateDay(creditCardData.dueDay, "Dia de vencimento");

  const { holderId } = creditCardData;

  if (holderId !== null && !memberIds.has(holderId)) {
    throw new Error("Titular não é membro desse espaço");
  }

  const { accountId } = creditCardData;

  if (accountId !== null) {
    const account = accountById.get(accountId);

    if (!account) {
      throw new Error("Conta não encontrada nesse espaço");
    }

    if (!account.isActive) {
      throw new Error("Conta está inativa");
    }
  }

  return {
    name,
    lastFour,
    creditLimit:
      creditLimitCents === null ? null : centsToDecimal(creditLimitCents),
    dueDay,
    holderId,
    accountId,
  };
}

export async function addSpaceCreditCard(creditCardData: CreditCardData) {
  // O espaço vem do cookie validado contra a lista de membros do usuário,
  // nunca do cliente.
  const space = await getActiveSpace();

  if (!space) {
    throw new Error("Espaço não encontrado");
  }

  const data = validateCreditCardData(
    creditCardData,
    new Set(space.Members.map((member) => member.Profile.id)),
    new Map(space.Accounts.map((account) => [account.id, account])),
  );

  const creditCard = await prisma.creditCard.create({
    data: { spaceId: space.id, ...data },
    select: { id: true },
  });

  return { id: creditCard.id };
}

export async function updateSpaceCreditCard(
  creditCardId: string,
  creditCardData: CreditCardData,
) {
  const space = await getActiveSpace();

  if (!space) {
    throw new Error("Espaço não encontrado");
  }

  const creditCard = await prisma.creditCard.findFirst({
    where: { id: creditCardId, spaceId: space.id },
    select: { id: true },
  });

  if (!creditCard) {
    throw new Error("Cartão não encontrado nesse espaço");
  }

  const data = validateCreditCardData(
    creditCardData,
    new Set(space.Members.map((member) => member.Profile.id)),
    new Map(space.Accounts.map((account) => [account.id, account])),
  );

  const updated = await prisma.creditCard.update({
    where: { id: creditCardId },
    data,
    select: { id: true },
  });

  return { id: updated.id };
}

export async function deleteSpaceCreditCard(creditCardId: string) {
  const space = await getActiveSpace();

  if (!space) {
    throw new Error("Espaço não encontrado");
  }

  const creditCard = await prisma.creditCard.findFirst({
    where: { id: creditCardId, spaceId: space.id },
    select: {
      _count: { select: { Transactions: true, InstallmentPurchases: true } },
    },
  });

  if (!creditCard) {
    throw new Error("Cartão não encontrado nesse espaço");
  }

  // `Transaction.creditCardId` é `onDelete: SetNull`, então excluir um cartão com
  // transações as deixaria órfãs silenciosamente.
  const hasHistory =
    creditCard._count.Transactions > 0 ||
    creditCard._count.InstallmentPurchases > 0;

  if (hasHistory) {
    await prisma.creditCard.update({
      where: { id: creditCardId },
      data: { isActive: false },
      select: { id: true },
    });

    return { archived: true };
  }

  await prisma.creditCard.delete({ where: { id: creditCardId } });

  return { archived: false };
}

export async function restoreSpaceCreditCard(creditCardId: string) {
  const space = await getActiveSpace();

  if (!space) {
    throw new Error("Espaço não encontrado");
  }

  const creditCard = await prisma.creditCard.findFirst({
    where: { id: creditCardId, spaceId: space.id },
    select: { id: true },
  });

  if (!creditCard) {
    throw new Error("Cartão não encontrado nesse espaço");
  }

  await prisma.creditCard.update({
    where: { id: creditCardId },
    data: { isActive: true },
    select: { id: true },
  });
}
