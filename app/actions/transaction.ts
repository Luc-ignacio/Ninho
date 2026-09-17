"use server";

import {
  TransactionMethod,
  TransactionType,
} from "@/app/generated/prisma/enums";
import prisma from "@/lib/prisma";
import { getActiveSpace } from "@/lib/space/get-active-space";
import { getSpaceTransactions } from "@/lib/space/queries";
import {
  parseTransactionFilters,
  toQueryFilters,
  transactionFiltersToQuery,
  TRANSACTIONS_PAGE_SIZE,
  type TransactionFilterValues,
} from "@/lib/space/transaction-filters";
import {
  addMonthsUtc,
  centsToDecimal,
  splitInstallmentCents,
  ymdToUtcDate,
} from "@/lib/utils";

export interface TransactionInput {
  type: TransactionType;
  method: TransactionMethod;
  date: string; // "YYYY-MM-DD"
  description: string;
  amountCents: number; // sempre positivo — a direção vem do tipo e das FKs
  originAccountId: string | null;
  destinationAccountId: string | null;
  creditCardId: string | null;
  categoryId: string | null;
  profileId: string | null;
  installments?: number;
}

export async function addSpaceTransaction(input: TransactionInput) {
  // `getActiveSpace` resolve o cookie `active-space` contra a lista de espaços
  // em que o usuário é membro, então a autorização já vem resolvida aqui.
  const space = await getActiveSpace();

  if (!space) {
    throw new Error("Espaço não encontrado");
  }

  // Os enums gerados pelo Prisma são objetos `as const`, não enums do TS.
  if (!Object.values(TransactionType).includes(input.type)) {
    throw new Error("Tipo de transação inválido");
  }

  if (!Object.values(TransactionMethod).includes(input.method)) {
    throw new Error("Forma de pagamento inválida");
  }

  const description = input.description.trim();

  if (!description) {
    throw new Error("Informe a descrição da transação");
  }

  if (description.length > 200) {
    throw new Error("A descrição deve ter no máximo 200 caracteres");
  }

  if (!Number.isSafeInteger(input.amountCents) || input.amountCents <= 0) {
    throw new Error("Valor inválido");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    throw new Error("Data inválida");
  }

  const date = ymdToUtcDate(input.date);

  // O round-trip rejeita datas que existem no formato mas não no calendário,
  // como "2026-02-31" (que o `Date` normalizaria para março).
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== input.date
  ) {
    throw new Error("Data inválida");
  }

  // `getActiveSpace` já carregou contas, cartões, categorias e membros, então
  // todas as verificações abaixo são em memória — nenhuma query extra.
  const accountById = new Map(space.Accounts.map((a) => [a.id, a]));
  const cardById = new Map(space.CreditCards.map((c) => [c.id, c]));
  const categoryIds = new Set(space.Categories.map((c) => c.id));
  const memberIds = new Set(space.Members.map((m) => m.Profile.id));

  const requireAccount = (accountId: string, label: string) => {
    const account = accountById.get(accountId);

    if (!account) {
      throw new Error(`${label} não encontrada nesse espaço`);
    }

    if (!account.isActive) {
      throw new Error(`${label} está inativa`);
    }

    return account;
  };

  const requireCard = (cardId: string) => {
    const card = cardById.get(cardId);

    if (!card) {
      throw new Error("Cartão não encontrado nesse espaço");
    }

    if (!card.isActive) {
      throw new Error("Cartão está inativo");
    }

    return card;
  };

  if (input.categoryId && !categoryIds.has(input.categoryId)) {
    throw new Error("Categoria não encontrada nesse espaço");
  }

  if (input.profileId && !memberIds.has(input.profileId)) {
    throw new Error("Responsável não é membro desse espaço");
  }

  let originAccountId: string | null = null;
  let destinationAccountId: string | null = null;
  let creditCardId: string | null = null;
  let categoryId: string | null = null;
  let method: TransactionMethod = input.method;

  // Campos que não pertencem ao tipo são rejeitados em vez de zerados em
  // silêncio — coerção silenciosa esconde bug de formulário.
  switch (input.type) {
    case "INCOME": {
      if (!input.destinationAccountId) {
        throw new Error("Selecione a conta de destino");
      }

      if (input.originAccountId || input.creditCardId) {
        throw new Error("Uma receita não tem conta de origem nem cartão");
      }

      requireAccount(input.destinationAccountId, "Conta de destino");
      destinationAccountId = input.destinationAccountId;
      categoryId = input.categoryId;
      break;
    }

    case "EXPENSE": {
      // Duas variantes: despesa no cartão (nenhuma conta, não afeta saldo) ou
      // despesa na conta (sai da conta de origem).
      if (input.creditCardId) {
        if (input.originAccountId || input.destinationAccountId) {
          throw new Error("Uma despesa no cartão não movimenta contas");
        }

        requireCard(input.creditCardId);
        creditCardId = input.creditCardId;
        method = "CREDIT_CARD";
      } else {
        if (!input.originAccountId) {
          throw new Error("Selecione a conta de origem");
        }

        if (input.destinationAccountId) {
          throw new Error("Uma despesa não tem conta de destino");
        }

        requireAccount(input.originAccountId, "Conta de origem");
        originAccountId = input.originAccountId;
      }

      categoryId = input.categoryId;
      break;
    }

    case "TRANSFER": {
      if (!input.originAccountId || !input.destinationAccountId) {
        throw new Error("Selecione a conta de origem e a de destino");
      }

      if (input.creditCardId) {
        throw new Error("Uma transferência não envolve cartão");
      }

      if (input.originAccountId === input.destinationAccountId) {
        throw new Error("A conta de origem e destino não podem ser a mesma");
      }

      const origin = requireAccount(input.originAccountId, "Conta de origem");
      const destination = requireAccount(
        input.destinationAccountId,
        "Conta de destino",
      );

      // `Transaction` tem um único `amount` e a moeda vive na `Account`, então
      // uma transferência entre moedas diferentes é irrepresentável.
      if (origin.currency !== destination.currency) {
        throw new Error(
          "Transferências entre contas de moedas diferentes ainda não são suportadas",
        );
      }

      originAccountId = input.originAccountId;
      destinationAccountId = input.destinationAccountId;
      // Transferência não é gasto: sem categoria, para não contar em dobro nos
      // relatórios por categoria.
      break;
    }

    case "CREDIT_CARD_PAYMENT": {
      if (!input.originAccountId) {
        throw new Error("Selecione a conta que pagou a fatura");
      }

      if (!input.creditCardId) {
        throw new Error("Selecione o cartão da fatura");
      }

      if (input.destinationAccountId) {
        throw new Error("Um pagamento de fatura não tem conta de destino");
      }

      requireAccount(input.originAccountId, "Conta de origem");
      requireCard(input.creditCardId);

      originAccountId = input.originAccountId;
      creditCardId = input.creditCardId;
      // Também sem categoria: o gasto já foi categorizado na despesa do cartão.
      break;
    }

    default: {
      const exhaustive: never = input.type;
      throw new Error(`Tipo de transação inválido: ${exhaustive}`);
    }
  }

  if (input.type !== "EXPENSE" && method === "CREDIT_CARD") {
    throw new Error(
      "Cartão de crédito só pode ser a forma de pagamento de uma despesa",
    );
  }

  const installments = input.installments ?? 1;

  if (
    !Number.isSafeInteger(installments) ||
    installments < 1 ||
    installments > 48
  ) {
    throw new Error("Número de parcelas inválido");
  }

  if (installments > 1) {
    if (input.type !== "EXPENSE" || !creditCardId) {
      throw new Error(
        "Só é possível parcelar uma despesa no cartão de crédito",
      );
    }

    if (input.amountCents < installments) {
      throw new Error("Valor muito baixo para esse número de parcelas");
    }

    const amounts = splitInstallmentCents(input.amountCents, installments);

    const purchase = await prisma.$transaction(async (tx) => {
      const purchase = await tx.installmentPurchase.create({
        data: {
          spaceId: space.id,
          accountId: null,
          profileId: input.profileId,
          creditCardId,
          description,
          purchaseDate: date,
          totalAmount: centsToDecimal(input.amountCents),
          totalInstallments: installments,
        },
        select: { id: true },
      });

      await tx.transaction.createMany({
        data: amounts.map((amountCents, index) => ({
          spaceId: space.id,
          date: addMonthsUtc(date, index),
          description,
          amount: centsToDecimal(amountCents),
          type: input.type,
          method,
          profileId: input.profileId,
          originAccountId: null,
          destinationAccountId: null,
          creditCardId,
          categoryId,
          installmentPurchaseId: purchase.id,
          installmentNumber: index + 1,
          installmentTotal: installments,
          importId: null,
          source: "MANUAL" as const,
          hashId: null,
        })),
      });

      return purchase;
    });

    return { id: purchase.id };
  }

  const transaction = await prisma.transaction.create({
    data: {
      spaceId: space.id,
      date,
      description,
      // `centsToDecimal` devolve string, que o Prisma aceita num campo Decimal.
      amount: centsToDecimal(input.amountCents),
      type: input.type,
      method,
      profileId: input.profileId,
      originAccountId,
      destinationAccountId,
      creditCardId,
      categoryId,
      installmentPurchaseId: null,
      installmentNumber: null,
      installmentTotal: null,
      importId: null,
      source: "MANUAL",
      // O Postgres usa NULLS DISTINCT por padrão, então os índices únicos
      // `(originAccountId, hashId)` e `(destinationAccountId, hashId)` nunca
      // conflitam para transações manuais.
      hashId: null,
    },
    // Devolver a linha inteira levaria um `Decimal` para o cliente, o que o
    // Next rejeita na fronteira da action.
    select: { id: true },
  });

  return { id: transaction.id };
}

export async function deleteSpaceTransaction(transactionId: string) {
  const space = await getActiveSpace();

  if (!space) {
    throw new Error("Espaço não encontrado");
  }

  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, spaceId: space.id },
    select: { id: true, installmentPurchaseId: true },
  });

  if (!transaction) {
    throw new Error("Transação não encontrada nesse espaço");
  }

  if (transaction.installmentPurchaseId) {
    await prisma.installmentPurchase.delete({
      where: { id: transaction.installmentPurchaseId },
    });

    return;
  }

  await prisma.transaction.delete({ where: { id: transactionId } });
}

export async function loadMoreSpaceTransactions(
  filters: TransactionFilterValues,
  skip: number,
  take: number = TRANSACTIONS_PAGE_SIZE,
) {
  const space = await getActiveSpace();

  if (!space) {
    throw new Error("Espaço não encontrado");
  }

  const safeFilters = parseTransactionFilters(
    Object.fromEntries(transactionFiltersToQuery(filters)),
  );

  return getSpaceTransactions(space.id, {
    ...toQueryFilters(safeFilters),
    take: Number.isFinite(take)
      ? Math.min(Math.max(1, Math.trunc(take)), TRANSACTIONS_PAGE_SIZE)
      : TRANSACTIONS_PAGE_SIZE,
    skip: Number.isFinite(skip) ? Math.max(0, Math.trunc(skip)) : 0,
  });
}
