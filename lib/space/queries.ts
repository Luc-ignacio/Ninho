import { cache } from "react";

import type { CurrencyType } from "@/app/generated/prisma/enums";
import { getActiveProfile } from "@/lib/auth/get-active-profile";
import prisma from "@/lib/prisma";
import {
  addDaysUtc,
  currentMonthRangeUtc,
  decimalToCents,
  todayYmd,
  toYmd,
  ymdToUtcDate,
} from "@/lib/utils";

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
 * Saldo derivado: o último snapshot vale como saldo de *fechamento* da sua data,
 * somado só às transações posteriores a ela (`>`). Tudo que aconteceu até aquele
 * dia já está embutido no valor observado — é essa convenção que deixa o saldo
 * do extrato (`LEDGERBAL`/`DTASOF`) e o saldo registrado à mão significarem a
 * mesma coisa. Conta sem nenhum snapshot soma tudo a partir do zero, que é o
 * caso de quem acabou de criar a conta e vai construir o saldo importando.
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
          ...(a.snapshotDate ? { date: { gt: a.snapshotDate } } : {}),
        })),
      },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["destinationAccountId"],
      where: {
        OR: accounts.map((a) => ({
          destinationAccountId: a.id,
          ...(a.snapshotDate ? { date: { gt: a.snapshotDate } } : {}),
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
 * O início da janela é `max(início do mês, dia seguinte ao snapshot)`: uma
 * transação até o snapshot não entra no saldo (já está embutida nele), então
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

  const period = (account: AccountBalanceInput) => {
    const afterSnapshot = account.snapshotDate
      ? addDaysUtc(account.snapshotDate, 1)
      : null;

    return {
      gte: afterSnapshot && afterSnapshot > start ? afterSnapshot : start,
      lt: end,
    };
  };

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
      usage.get(row.creditCardId)! + (row.type === "EXPENSE" ? cents : -cents),
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
        orderBy: {
          name: "asc",
        },
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

    const [rows, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take,
        skip,
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
        date: date.toISOString().slice(0, 10),
      })),
    };
  },
);

const CURRENCY_ORDER: CurrencyType[] = ["BRL", "USD", "AUD"];
const TOP_SLICES = 8;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface DashboardSlice {
  id: string | null;
  name: string;
  cents: number;
  share: number;
}

export function sumBalancesByCurrency(
  accounts: { currency: CurrencyType; balanceCents: number }[],
) {
  const totals = new Map<CurrencyType, number>();

  for (const account of accounts) {
    totals.set(
      account.currency,
      (totals.get(account.currency) ?? 0) + account.balanceCents,
    );
  }

  return CURRENCY_ORDER.filter((currency) => totals.has(currency)).map(
    (currency) => ({ currency, balanceCents: totals.get(currency)! }),
  );
}

function resolveCurrency(
  originAccountId: string | null,
  destinationAccountId: string | null,
  creditCardId: string | null,
  accountCurrency: Map<string, CurrencyType>,
  cardCurrency: Map<string, CurrencyType | null>,
) {
  if (originAccountId) return accountCurrency.get(originAccountId) ?? null;
  if (destinationAccountId)
    return accountCurrency.get(destinationAccountId) ?? null;
  if (creditCardId) return cardCurrency.get(creditCardId) ?? null;

  return null;
}

function addCents(
  buckets: Map<CurrencyType, Map<string | null, number>>,
  currency: CurrencyType,
  key: string | null,
  cents: number,
) {
  const bucket = buckets.get(currency) ?? new Map<string | null, number>();

  bucket.set(key, (bucket.get(key) ?? 0) + cents);
  buckets.set(currency, bucket);
}

function toSlices(
  bucket: Map<string | null, number> | undefined,
  nameFor: (id: string | null) => string,
  totalCents: number,
): DashboardSlice[] {
  if (!bucket) return [];

  const ranked = [...bucket.entries()]
    .map(([id, cents]) => ({ id, name: nameFor(id), cents }))
    .sort((a, b) => b.cents - a.cents || a.name.localeCompare(b.name, "pt-BR"));

  const head = ranked.slice(0, TOP_SLICES);
  const tail = ranked.slice(TOP_SLICES);

  const slices = tail.length
    ? [
        ...head,
        {
          id: null,
          name: "Outros",
          cents: tail.reduce((sum, slice) => sum + slice.cents, 0),
        },
      ]
    : head;

  return slices.map((slice) => ({
    ...slice,
    share: totalCents === 0 ? 0 : slice.cents / totalCents,
  }));
}

export const getSpaceDashboard = cache(
  async (spaceId: string, monthStartYmd: string, monthEndYmd: string) => {
    const start = ymdToUtcDate(monthStartYmd);
    const end = ymdToUtcDate(monthEndYmd);

    const period = { gte: start, lt: end };
    const incomeWhere = { spaceId, type: "INCOME" as const, date: period };

    const expenseWhere = { spaceId, type: "EXPENSE" as const, date: period };

    const [
      accounts,
      cards,
      categories,
      profiles,
      incomeRows,
      categoryRows,
      profileRows,
      dailyRows,
    ] = await Promise.all([
      prisma.account.findMany({
        where: { spaceId },
        select: { id: true, currency: true },
      }),
      prisma.creditCard.findMany({
        where: { spaceId },
        select: { id: true, accountId: true },
      }),
      prisma.category.findMany({
        where: { spaceId },
        select: { id: true, name: true },
      }),
      prisma.profile.findMany({
        where: { Transactions: { some: expenseWhere } },
        select: { id: true, name: true },
      }),
      prisma.transaction.groupBy({
        by: ["date", "destinationAccountId"],
        where: incomeWhere,
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ["categoryId", "originAccountId", "creditCardId"],
        where: expenseWhere,
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ["profileId", "originAccountId", "creditCardId"],
        where: expenseWhere,
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ["date", "originAccountId", "creditCardId"],
        where: expenseWhere,
        _sum: { amount: true },
      }),
    ]);

    const accountCurrency = new Map(
      accounts.map((account) => [account.id, account.currency]),
    );
    const cardCurrency = new Map(
      cards.map((card) => [
        card.id,
        card.accountId ? (accountCurrency.get(card.accountId) ?? null) : null,
      ]),
    );
    const categoryName = new Map(
      categories.map((category) => [category.id, category.name]),
    );
    const profileName = new Map(
      profiles.map((profile) => [profile.id, profile.name]),
    );

    const incomeCents = new Map<CurrencyType, number>();
    const expenseCents = new Map<CurrencyType, number>();
    const byCategory = new Map<CurrencyType, Map<string | null, number>>();
    const byProfile = new Map<CurrencyType, Map<string | null, number>>();
    const byDay = new Map<CurrencyType, Map<string, number>>();

    let unresolvedIncomeCents = 0;
    let unresolvedExpenseCents = 0;
    let lastExpenseYmd: string | null = null;

    for (const row of incomeRows) {
      const currency = resolveCurrency(
        null,
        row.destinationAccountId,
        null,
        accountCurrency,
        cardCurrency,
      );
      const cents = decimalToCents(row._sum.amount);

      if (!currency) {
        unresolvedIncomeCents += cents;
        continue;
      }

      incomeCents.set(currency, (incomeCents.get(currency) ?? 0) + cents);
    }

    for (const row of categoryRows) {
      const currency = resolveCurrency(
        row.originAccountId,
        null,
        row.creditCardId,
        accountCurrency,
        cardCurrency,
      );
      const cents = decimalToCents(row._sum.amount);

      if (!currency) {
        unresolvedExpenseCents += cents;
        continue;
      }

      expenseCents.set(currency, (expenseCents.get(currency) ?? 0) + cents);
      addCents(byCategory, currency, row.categoryId, cents);
    }

    for (const row of profileRows) {
      const currency = resolveCurrency(
        row.originAccountId,
        null,
        row.creditCardId,
        accountCurrency,
        cardCurrency,
      );

      if (!currency) continue;

      addCents(byProfile, currency, row.profileId, decimalToCents(row._sum.amount));
    }

    for (const row of dailyRows) {
      const ymd = row.date.toISOString().slice(0, 10);

      if (!lastExpenseYmd || ymd > lastExpenseYmd) {
        lastExpenseYmd = ymd;
      }

      const currency = resolveCurrency(
        row.originAccountId,
        null,
        row.creditCardId,
        accountCurrency,
        cardCurrency,
      );

      if (!currency) continue;

      const bucket = byDay.get(currency) ?? new Map<string, number>();

      bucket.set(
        ymd,
        (bucket.get(ymd) ?? 0) + decimalToCents(row._sum.amount),
      );
      byDay.set(currency, bucket);
    }

    const lastDayOfMonth = new Date(end.getTime() - DAY_MS)
      .toISOString()
      .slice(0, 10);
    const today = todayYmd();

    let cutoffYmd = today > monthStartYmd ? today : monthStartYmd;

    if (lastExpenseYmd && lastExpenseYmd > cutoffYmd) cutoffYmd = lastExpenseYmd;
    if (cutoffYmd > lastDayOfMonth) cutoffYmd = lastDayOfMonth;

    const days: string[] = [];

    for (
      let day = start;
      day.toISOString().slice(0, 10) <= cutoffYmd;
      day = new Date(day.getTime() + DAY_MS)
    ) {
      days.push(day.toISOString().slice(0, 10));
    }

    const accountCurrencies = new Set(accounts.map((account) => account.currency));

    const currencies = CURRENCY_ORDER.filter(
      (currency) =>
        accountCurrencies.has(currency) ||
        incomeCents.has(currency) ||
        expenseCents.has(currency),
    ).map((currency) => {
      const income = incomeCents.get(currency) ?? 0;
      const expense = expenseCents.get(currency) ?? 0;
      const dayBucket = byDay.get(currency);

      return {
        currency,
        incomeCents: income,
        expenseCents: expense,
        netCents: income - expense,
        dailyExpenses: days.map((date) => ({
          date,
          cents: dayBucket?.get(date) ?? 0,
        })),
        expensesByCategory: toSlices(
          byCategory.get(currency),
          (id) => (id ? (categoryName.get(id) ?? "Outro") : "Sem categoria"),
          expense,
        ),
        expensesByProfile: toSlices(
          byProfile.get(currency),
          (id) => (id ? (profileName.get(id) ?? "Outro") : "Sem responsável"),
          expense,
        ),
      };
    });

    return {
      monthStartYmd,
      monthEndYmd,
      days,
      currencies,
      unresolvedIncomeCents,
      unresolvedExpenseCents,
    };
  },
);

export type SpaceDashboard = Awaited<ReturnType<typeof getSpaceDashboard>>;
export type DashboardCurrency = SpaceDashboard["currencies"][number];

export const getSpaceCategoryHistory = cache(
  async (spaceId: string, take: number = 2000) => {
    const rows = await prisma.transaction.findMany({
      where: { spaceId, categoryId: { not: null } },
      orderBy: { date: "desc" },
      take,
      select: { description: true, categoryId: true, date: true },
    });

    return rows.map((row) => ({
      description: row.description,
      categoryId: row.categoryId as string,
      ymd: row.date.toISOString().slice(0, 10),
    }));
  },
);

export const getSpaceImportDedupeIndex = cache(
  async (
    spaceId: string,
    accountId: string | null,
    creditCardId: string | null,
    startYmd: string,
    endYmd: string,
  ) => {
    const scope = creditCardId
      ? { creditCardId }
      : accountId
        ? {
            OR: [
              { originAccountId: accountId },
              { destinationAccountId: accountId },
            ],
          }
        : {};

    const rows = await prisma.transaction.findMany({
      where: {
        spaceId,
        date: { gte: ymdToUtcDate(startYmd), lte: ymdToUtcDate(endYmd) },
        ...scope,
      },
      select: { hashId: true, date: true, description: true, amount: true },
    });

    return rows.map((row) => ({
      hashId: row.hashId,
      ymd: row.date.toISOString().slice(0, 10),
      description: row.description,
      amountCents: decimalToCents(row.amount),
    }));
  },
);

export const getSpaceImports = cache(
  async (spaceId: string, take: number = 20) => {
    const rows = await prisma.import.findMany({
      where: { spaceId },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        fileName: true,
        type: true,
        status: true,
        referenceMonth: true,
        createdAt: true,
        Account: { select: { id: true, name: true } },
        CreditCard: { select: { id: true, name: true, lastFour: true } },
        ImportedBy: { select: { id: true, name: true } },
        _count: { select: { Transactions: true } },
      },
    });

    return rows.map(({ referenceMonth, createdAt, _count, ...row }) => ({
      ...row,
      transactionCount: _count.Transactions,
      referenceMonthYmd: referenceMonth?.toISOString().slice(0, 10) ?? null,
      createdAtYmd: toYmd(createdAt),
    }));
  },
);

export type SpaceImport = Awaited<ReturnType<typeof getSpaceImports>>[number];
