import { cache } from "react";

import { getActiveProfile } from "@/lib/auth/get-active-profile";
import prisma from "@/lib/prisma";
import { currentMonthRangeUtc, decimalToCents } from "@/lib/utils";

export type ProfileSpace = Awaited<
  ReturnType<typeof getSpacesByProfile>
>[number];

export type SpaceMember = Awaited<
  NonNullable<Awaited<ReturnType<typeof getSpaceById>>>
>["Members"][number];

export type SpaceAccount = Awaited<
  NonNullable<Awaited<ReturnType<typeof getSpaceById>>>
>["Accounts"][number];

export type SpaceCategory = Awaited<
  NonNullable<Awaited<ReturnType<typeof getSpaceById>>>
>["Categories"][number];

export type SpaceCreditCard = Awaited<
  NonNullable<Awaited<ReturnType<typeof getSpaceById>>>
>["CreditCards"][number];

export type SpaceTransaction = Awaited<
  ReturnType<typeof getSpaceTransactions>
>["transactions"][number];

export type SpaceAccountDetail = NonNullable<
  Awaited<ReturnType<typeof getSpaceAccountById>>
>;

interface AccountBalanceInput {
  id: string;
  snapshotDate: Date | null;
  snapshotCents: number;
}

/**
 * Saldo derivado: o último snapshot vale como saldo de *abertura* da sua data,
 * somado às transações a partir dela (`>=`, para não descartar as transações
 * lançadas no mesmo dia em que a conta foi criada).
 *
 * A direção vem só das FKs — `destinationAccountId` soma, `originAccountId`
 * subtrai — então nenhum tipo precisa de tratamento especial. Uma despesa no
 * cartão não seta nenhuma das duas e naturalmente não afeta saldo; uma
 * transferência aparece nas duas somas e move as duas contas a partir da mesma
 * linha.
 */
async function getAccountBalancesCents(accounts: AccountBalanceInput[]) {
  const balances = new Map(accounts.map((a) => [a.id, a.snapshotCents]));

  if (accounts.length === 0) return balances;

  // O `OR` de pares é o que permite um corte de data *por conta* dentro de um
  // único groupBy, em vez de uma query por conta.
  const [outflows, inflows] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["originAccountId"],
      where: {
        OR: accounts.map((a) => ({
          originAccountId: a.id,
          ...(a.snapshotDate ? { date: { gte: a.snapshotDate } } : {}),
        })),
      },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["destinationAccountId"],
      where: {
        OR: accounts.map((a) => ({
          destinationAccountId: a.id,
          ...(a.snapshotDate ? { date: { gte: a.snapshotDate } } : {}),
        })),
      },
      _sum: { amount: true },
    }),
  ]);

  for (const row of inflows) {
    const accountId = row.destinationAccountId;
    if (!accountId || !balances.has(accountId)) continue;

    balances.set(
      accountId,
      balances.get(accountId)! + decimalToCents(row._sum.amount),
    );
  }

  for (const row of outflows) {
    const accountId = row.originAccountId;
    if (!accountId || !balances.has(accountId)) continue;

    balances.set(
      accountId,
      balances.get(accountId)! - decimalToCents(row._sum.amount),
    );
  }

  return balances;
}

interface AccountMonthFlowCents {
  inflowCents: number;
  outflowCents: number;
}

/**
 * Entradas e saídas do mês corrente, por conta. A direção vem das mesmas FKs do
 * saldo derivado: uma transferência entre contas do espaço conta como saída numa
 * e entrada na outra, e uma despesa no cartão não aparece em nenhuma.
 *
 * O início da janela é `max(início do mês, data do snapshot)`: uma transação
 * anterior ao snapshot não entra no saldo (ela já está embutida nele), então
 * mostrá-la como movimento do mês faria o card exibir uma variação que o saldo
 * ao lado não acompanha. Como o corte volta a ser por conta, o `OR` de pares é
 * de novo o que resolve tudo num único groupBy.
 */
async function getAccountMonthFlowsCents(
  accounts: AccountBalanceInput[],
  start: Date,
  end: Date,
) {
  const flows = new Map<string, AccountMonthFlowCents>(
    accounts.map((a) => [a.id, { inflowCents: 0, outflowCents: 0 }]),
  );

  if (accounts.length === 0) return flows;

  const period = (account: AccountBalanceInput) => ({
    gte:
      account.snapshotDate && account.snapshotDate > start
        ? account.snapshotDate
        : start,
    lt: end,
  });

  const [outflows, inflows] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["originAccountId"],
      where: {
        OR: accounts.map((a) => ({
          originAccountId: a.id,
          date: period(a),
        })),
      },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["destinationAccountId"],
      where: {
        OR: accounts.map((a) => ({
          destinationAccountId: a.id,
          date: period(a),
        })),
      },
      _sum: { amount: true },
    }),
  ]);

  for (const row of inflows) {
    const flow = row.destinationAccountId
      ? flows.get(row.destinationAccountId)
      : undefined;

    if (!flow) continue;

    flow.inflowCents += decimalToCents(row._sum.amount);
  }

  for (const row of outflows) {
    const flow = row.originAccountId
      ? flows.get(row.originAccountId)
      : undefined;

    if (!flow) continue;

    flow.outflowCents += decimalToCents(row._sum.amount);
  }

  return flows;
}

async function getCreditCardUsageCents(cardIds: string[]) {
  const usage = new Map(cardIds.map((id) => [id, 0]));

  if (cardIds.length === 0) return usage;

  const rows = await prisma.transaction.groupBy({
    by: ["creditCardId", "type"],
    where: {
      creditCardId: { in: cardIds },
      type: { in: ["EXPENSE", "CREDIT_CARD_PAYMENT"] },
    },
    _sum: { amount: true },
  });

  for (const row of rows) {
    if (!row.creditCardId || !usage.has(row.creditCardId)) continue;

    const cents = decimalToCents(row._sum.amount);

    usage.set(
      row.creditCardId,
      usage.get(row.creditCardId)! +
        (row.type === "EXPENSE" ? cents : -cents),
    );
  }

  return usage;
}

export const getSpacesByProfile = cache(async () => {
  const profile = await getActiveProfile();

  if (!profile) {
    throw new Error("Perfil não encontrado");
  }

  return await prisma.space.findMany({
    where: {
      Members: {
        some: {
          profileId: profile.id,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
});

export const getSpaceById = cache(async (id: string) => {
  const space = await prisma.space.findUnique({
    where: {
      id,
    },
    include: {
      Members: {
        select: {
          id: true,
          role: true,
          joinedAt: true,
          Profile: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          joinedAt: "asc",
        },
      },
      Categories: {
        select: {
          id: true,
          spaceId: true,
          name: true,
          _count: {
            select: {
              Transactions: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      },
      Accounts: {
        include: {
          BalanceSnapshots: {
            orderBy: {
              date: "desc",
            },
            take: 1,
          },
          Profile: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      CreditCards: {
        select: {
          id: true,
          name: true,
          lastFour: true,
          creditLimit: true,
          dueDay: true,
          isActive: true,
          Holder: {
            select: {
              id: true,
              name: true,
            },
          },
          Account: {
            select: {
              id: true,
              name: true,
              currency: true,
            },
          },
          _count: {
            select: {
              Transactions: true,
              InstallmentPurchases: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      },
    },
  });

  if (!space) return null;

  const accounts = space.Accounts.map((account) => ({
    ...account,
    BalanceSnapshots: account.BalanceSnapshots.map(
      ({ balance, ...snapshot }) => ({
        ...snapshot,
        balanceCents: decimalToCents(balance),
      }),
    ),
  }));

  const month = currentMonthRangeUtc();

  const balanceInputs = accounts.map((account) => ({
    id: account.id,
    snapshotDate: account.BalanceSnapshots[0]?.date ?? null,
    snapshotCents: account.BalanceSnapshots[0]?.balanceCents ?? 0,
  }));

  const [balances, monthFlows, cardUsage] = await Promise.all([
    getAccountBalancesCents(balanceInputs),
    getAccountMonthFlowsCents(balanceInputs, month.start, month.end),
    getCreditCardUsageCents(space.CreditCards.map((card) => card.id)),
  ]);

  return {
    ...space,
    Accounts: accounts.map((account) => ({
      ...account,
      balanceCents: balances.get(account.id) ?? 0,
      monthInflowCents: monthFlows.get(account.id)?.inflowCents ?? 0,
      monthOutflowCents: monthFlows.get(account.id)?.outflowCents ?? 0,
    })),
    CreditCards: space.CreditCards.map(({ creditLimit, ...card }) => {
      const creditLimitCents =
        creditLimit === null ? null : decimalToCents(creditLimit);
      const usedCents = cardUsage.get(card.id) ?? 0;

      return {
        ...card,
        creditLimitCents,
        usedCents,
        availableCents:
          creditLimitCents === null ? null : creditLimitCents - usedCents,
      };
    }),
  };
});

// `spaceId` chega resolvido pela página (que já chamou `getActiveSpace`) em vez
// de ser resolvido aqui: `get-active-space.ts` importa deste módulo, então a
// chamada inversa criaria um ciclo de imports.
export const getSpaceAccountById = cache(
  async (accountId: string, spaceId: string) => {
    const spaceAccount = await prisma.account.findFirst({
      // O `spaceId` escopa a conta ao espaço do usuário.
      where: {
        id: accountId,
        spaceId,
      },
      select: {
        id: true,
        spaceId: true,
        name: true,
        type: true,
        currency: true,
        isActive: true,
        createdAt: true,
        Profile: {
          select: {
            id: true,
            name: true,
          },
        },
        BalanceSnapshots: {
          orderBy: {
            date: "desc",
          },
          take: 1,
          select: {
            id: true,
            date: true,
            balance: true,
          },
        },
      },
    });

    if (!spaceAccount) return null;

    const balanceSnapshots = spaceAccount.BalanceSnapshots.map(
      ({ balance, ...snapshot }) => ({
        ...snapshot,
        balanceCents: decimalToCents(balance),
      }),
    );

    const balances = await getAccountBalancesCents([
      {
        id: spaceAccount.id,
        snapshotDate: balanceSnapshots[0]?.date ?? null,
        snapshotCents: balanceSnapshots[0]?.balanceCents ?? 0,
      },
    ]);

    return {
      ...spaceAccount,
      BalanceSnapshots: balanceSnapshots,
      balanceCents: balances.get(spaceAccount.id) ?? 0,
    };
  },
);

// Parâmetros primitivos de propósito: o `cache` do React compara argumentos por
// identidade, então um objeto de opções recriaria a chave a cada chamada e
// anularia a memoização.
export const getSpaceTransactions = cache(
  async (
    spaceId: string,
    accountId: string | null = null,
    creditCardId: string | null = null,
    take: number = 50,
    skip: number = 0,
  ) => {
    const where = {
      spaceId,
      ...(accountId
        ? {
            OR: [
              { originAccountId: accountId },
              { destinationAccountId: accountId },
            ],
          }
        : {}),
      ...(creditCardId ? { creditCardId } : {}),
    };

    const [rows, total] = await prisma.$transaction([
      prisma.transaction.findMany({
        where,
        // `date` tem granularidade de dia, então `createdAt` desempata.
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take,
        skip,
        // `select` explícito (e não `include`) é o que impede um `Decimal` de
        // vazar para o cliente através das relações.
        select: {
          id: true,
          date: true,
          description: true,
          amount: true,
          type: true,
          method: true,
          source: true,
          installmentNumber: true,
          installmentTotal: true,
          Category: {
            select: {
              id: true,
              name: true,
            },
          },
          Profile: {
            select: {
              id: true,
              name: true,
            },
          },
          OriginAccount: {
            select: {
              id: true,
              name: true,
              currency: true,
            },
          },
          DestinationAccount: {
            select: {
              id: true,
              name: true,
              currency: true,
            },
          },
          CreditCard: {
            select: {
              id: true,
              name: true,
              lastFour: true,
              Account: {
                select: {
                  currency: true,
                },
              },
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      total,
      transactions: rows.map(({ amount, date, ...transaction }) => ({
        ...transaction,
        amountCents: decimalToCents(amount),
        // Seguro porque uma coluna `@db.Date` sempre volta como meia-noite UTC
        // exata. A string evita que o cliente formate no fuso local e mostre o
        // dia anterior.
        date: date.toISOString().slice(0, 10),
      })),
    };
  },
);
