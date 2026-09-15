"use server";

import {
  ImportType,
  TransactionMethod,
  TransactionType,
} from "@/app/generated/prisma/enums";
import { getActiveProfile } from "@/lib/auth/get-active-profile";
import prisma from "@/lib/prisma";
import { getActiveSpace } from "@/lib/space/get-active-space";
import {
  getSpaceCategoryHistory,
  getSpaceImportDedupeIndex,
} from "@/lib/space/queries";
import {
  buildHistoryIndex,
  inferMethod,
  inferType,
  suggestCategory,
  type CategorySource,
} from "@/lib/import/categorize";
import { buildFingerprint, buildHashId } from "@/lib/import/dedupe";
import {
  extractCounterparty,
  extractInstallment,
  normalizeDescription,
  normalizeForMethod,
} from "@/lib/import/normalize";
import { parseOfx } from "@/lib/import/ofx";
import { addDaysUtc, centsToDecimal, toYmd, ymdToUtcDate } from "@/lib/utils";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_ROWS = 2000;
const DEDUPE_PADDING_DAYS = 5;

export type DuplicateKind = "none" | "hash" | "fingerprint";

export interface PreviewImportInput {
  fileName: string;
  bytes: Uint8Array;
  accountId: string | null;
  creditCardId: string | null;
}

export interface PreviewImportRow {
  key: string;
  ymd: string;
  description: string;
  rawDescription: string;
  amountCents: number;
  type: TransactionType;
  method: TransactionMethod;
  categoryId: string | null;
  suggestedCategoryName: string | null;
  categorySource: CategorySource;
  installmentNumber: number | null;
  installmentTotal: number | null;
  hashId: string;
  duplicate: DuplicateKind;
}

export interface PreviewImportResult {
  fileName: string;
  type: ImportType;
  accountId: string | null;
  creditCardId: string | null;
  acctIdMasked: string | null;
  currency: string | null;
  periodStartYmd: string | null;
  periodEndYmd: string | null;
  referenceMonthYmd: string | null;
  ledgerBalanceCents: number | null;
  ledgerBalanceYmd: string | null;
  accountBalanceCents: number | null;
  accountBalanceYmd: string | null;
  rows: PreviewImportRow[];
  skipped: number;
  suggestedCategoryNames: string[];
}

export interface CommitImportRow {
  ymd: string;
  description: string;
  amountCents: number;
  type: TransactionType;
  method: TransactionMethod;
  categoryId: string | null;
  newCategoryName: string | null;
  installmentNumber: number | null;
  installmentTotal: number | null;
  hashId: string;
}

export interface CommitImportInput {
  fileName: string;
  type: ImportType;
  accountId: string | null;
  creditCardId: string | null;
  referenceMonthYmd: string | null;
  ledgerBalanceCents: number | null;
  ledgerBalanceYmd: string | null;
  rows: CommitImportRow[];
}

export interface CommitImportResult {
  importId: string;
  created: number;
  skipped: number;
  balanceCents: number | null;
  balanceYmd: string | null;
}

type ResolvedSpace = NonNullable<Awaited<ReturnType<typeof getActiveSpace>>>;

async function requireSpace() {
  const space = await getActiveSpace();

  if (!space) {
    throw new Error("Espaço não encontrado");
  }

  return space;
}

function resolveTarget(
  space: ResolvedSpace,
  accountId: string | null,
  creditCardId: string | null,
) {
  if ((accountId && creditCardId) || (!accountId && !creditCardId)) {
    throw new Error("Selecione a conta ou o cartão do arquivo");
  }

  if (creditCardId) {
    const card = space.CreditCards.find((item) => item.id === creditCardId);

    if (!card) {
      throw new Error("Cartão não encontrado nesse espaço");
    }

    if (!card.isActive) {
      throw new Error("Cartão está inativo");
    }

    return { card, account: null };
  }

  const account = space.Accounts.find((item) => item.id === accountId);

  if (!account) {
    throw new Error("Conta não encontrada nesse espaço");
  }

  if (!account.isActive) {
    throw new Error("Conta está inativa");
  }

  return { card: null, account };
}

function shiftYmd(ymd: string, days: number) {
  return addDaysUtc(ymdToUtcDate(ymd), days).toISOString().slice(0, 10);
}

function isValidYmd(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = ymdToUtcDate(value);

  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export async function previewImport(
  input: PreviewImportInput,
): Promise<PreviewImportResult> {
  const space = await requireSpace();

  const fileName = input.fileName?.trim() ?? "";

  if (!fileName || fileName.length > 255) {
    throw new Error("Nome de arquivo inválido");
  }

  if (!fileName.toLowerCase().endsWith(".ofx")) {
    throw new Error("Por enquanto só arquivos .ofx são suportados");
  }

  const bytes =
    input.bytes instanceof Uint8Array ? input.bytes : new Uint8Array();

  if (bytes.byteLength === 0) {
    throw new Error("Arquivo vazio");
  }

  if (bytes.byteLength > MAX_FILE_BYTES) {
    throw new Error("Arquivo muito grande");
  }

  const { card, account } = resolveTarget(
    space,
    input.accountId,
    input.creditCardId,
  );

  const statement = parseOfx(bytes);
  const isCard = statement.type === "CREDIT_CARD_STATEMENT";

  if (isCard && !card) {
    throw new Error(
      "Esse arquivo é uma fatura de cartão. Selecione um cartão de crédito.",
    );
  }

  if (!isCard && !account) {
    throw new Error(
      "Esse arquivo é um extrato de conta. Selecione uma conta.",
    );
  }

  const today = toYmd(new Date());
  const startYmd = shiftYmd(
    statement.periodStartYmd ?? statement.referenceMonthYmd ?? today,
    -DEDUPE_PADDING_DAYS,
  );
  const endYmd = shiftYmd(
    statement.periodEndYmd ?? statement.referenceMonthYmd ?? today,
    DEDUPE_PADDING_DAYS,
  );

  const [history, existing] = await Promise.all([
    getSpaceCategoryHistory(space.id),
    getSpaceImportDedupeIndex(
      space.id,
      account?.id ?? null,
      card?.id ?? null,
      startYmd,
      endYmd,
    ),
  ]);

  const historyIndex = buildHistoryIndex(history);
  const categoryIdByName = new Map(
    space.Categories.map((category) => [
      normalizeDescription(category.name),
      category.id,
    ]),
  );

  const knownHashes = new Set(
    existing
      .map((row) => row.hashId)
      .filter((hash): hash is string => hash !== null),
  );
  const knownFingerprints = new Set(
    existing.map((row) =>
      buildFingerprint(
        row.ymd,
        row.amountCents,
        normalizeDescription(extractCounterparty(row.description)),
      ),
    ),
  );

  const scope = card?.id ?? account?.id ?? space.id;
  const currentAnchor = account?.BalanceSnapshots[0] ?? null;
  const suggestedNames = new Set<string>();

  const rows = statement.transactions.map((transaction, index) => {
    const installment = extractInstallment(transaction.description, isCard);
    const description = installment?.description ?? transaction.description;
    const methodText = normalizeForMethod(transaction.rawDescription);
    const normalized = normalizeDescription(extractCounterparty(description));

    const type = inferType(statement.type, transaction.direction, methodText);
    const method = inferMethod(
      statement.type,
      type,
      transaction.trntype,
      methodText,
    );

    const suggestion =
      type === "CREDIT_CARD_PAYMENT"
        ? {
            categoryId: null,
            suggestedCategoryName: null,
            source: "none" as CategorySource,
          }
        : suggestCategory(normalized, historyIndex, categoryIdByName);

    if (suggestion.suggestedCategoryName) {
      suggestedNames.add(suggestion.suggestedCategoryName);
    }

    const hashId = buildHashId(
      scope,
      transaction.fitid,
      transaction.ymd,
      transaction.amountCents,
      normalized,
    );

    const fingerprint = buildFingerprint(
      transaction.ymd,
      transaction.amountCents,
      normalized,
    );

    const duplicate: DuplicateKind = knownHashes.has(hashId)
      ? "hash"
      : knownFingerprints.has(fingerprint)
        ? "fingerprint"
        : "none";

    return {
      key: String(index),
      ymd: transaction.ymd,
      description,
      rawDescription: transaction.rawDescription,
      amountCents: transaction.amountCents,
      type,
      method,
      categoryId: suggestion.categoryId,
      suggestedCategoryName: suggestion.suggestedCategoryName,
      categorySource: suggestion.source,
      installmentNumber: installment?.number ?? null,
      installmentTotal: installment?.total ?? null,
      hashId,
      duplicate,
    };
  });

  return {
    fileName,
    type: statement.type,
    accountId: account?.id ?? null,
    creditCardId: card?.id ?? null,
    acctIdMasked: statement.acctId ? statement.acctId.slice(-4) : null,
    currency: statement.currency,
    periodStartYmd: statement.periodStartYmd,
    periodEndYmd: statement.periodEndYmd,
    referenceMonthYmd: statement.referenceMonthYmd,
    ledgerBalanceCents: statement.ledgerBalanceCents,
    ledgerBalanceYmd: statement.ledgerBalanceYmd,
    accountBalanceCents: currentAnchor?.balanceCents ?? null,
    accountBalanceYmd: currentAnchor
      ? currentAnchor.date.toISOString().slice(0, 10)
      : null,
    rows,
    skipped: statement.skipped,
    suggestedCategoryNames: [...suggestedNames].sort(),
  };
}

export async function commitImport(
  input: CommitImportInput,
): Promise<CommitImportResult> {
  const space = await requireSpace();
  const profile = await getActiveProfile();

  if (!Object.values(ImportType).includes(input.type)) {
    throw new Error("Tipo de importação inválido");
  }

  const fileName = input.fileName?.trim() ?? "";

  if (!fileName || fileName.length > 255) {
    throw new Error("Nome de arquivo inválido");
  }

  const rows = input.rows ?? [];

  if (rows.length === 0) {
    throw new Error("Selecione ao menos uma transação");
  }

  if (rows.length > MAX_ROWS) {
    throw new Error("Arquivo com transações demais para uma importação");
  }

  const { card, account } = resolveTarget(
    space,
    input.accountId,
    input.creditCardId,
  );

  const isCard = input.type === "CREDIT_CARD_STATEMENT";

  if (isCard !== Boolean(card)) {
    throw new Error("O tipo de importação não corresponde ao destino");
  }

  const categoryIds = new Set(space.Categories.map((category) => category.id));
  const memberIds = new Set(space.Members.map((member) => member.Profile.id));

  const holderId = card?.Holder?.id ?? account?.Profile?.id ?? null;
  const defaultProfileId =
    holderId && memberIds.has(holderId) ? holderId : null;

  const newNames = new Set<string>();

  for (const row of rows) {
    if (!Object.values(TransactionType).includes(row.type)) {
      throw new Error("Tipo de transação inválido");
    }

    if (!Object.values(TransactionMethod).includes(row.method)) {
      throw new Error("Forma de pagamento inválida");
    }

    const description = row.description?.trim() ?? "";

    if (!description) {
      throw new Error("Informe a descrição da transação");
    }

    if (description.length > 200) {
      throw new Error("A descrição deve ter no máximo 200 caracteres");
    }

    if (!Number.isSafeInteger(row.amountCents) || row.amountCents <= 0) {
      throw new Error("Valor inválido");
    }

    if (!isValidYmd(row.ymd)) {
      throw new Error("Data inválida");
    }

    if (!row.hashId || row.hashId.length > 255) {
      throw new Error("Identificador de duplicidade inválido");
    }

    if (row.method === "CREDIT_CARD" && row.type !== "EXPENSE") {
      throw new Error(
        "Cartão de crédito só pode ser a forma de pagamento de uma despesa",
      );
    }

    const allowed: TransactionType[] = isCard
      ? ["EXPENSE", "CREDIT_CARD_PAYMENT"]
      : ["INCOME", "EXPENSE", "CREDIT_CARD_PAYMENT"];

    if (!allowed.includes(row.type)) {
      throw new Error("Tipo de transação incompatível com o arquivo");
    }

    if (row.categoryId && row.newCategoryName) {
      throw new Error("Escolha uma categoria existente ou crie uma nova");
    }

    if (row.categoryId && !categoryIds.has(row.categoryId)) {
      throw new Error("Categoria não encontrada nesse espaço");
    }

    if (row.type === "CREDIT_CARD_PAYMENT" && (row.categoryId || row.newCategoryName)) {
      throw new Error("Pagamento de fatura não recebe categoria");
    }

    const hasNumber = row.installmentNumber !== null;
    const hasTotal = row.installmentTotal !== null;

    if (hasNumber !== hasTotal) {
      throw new Error("Parcelamento inválido");
    }

    if (hasNumber) {
      const number = row.installmentNumber as number;
      const total = row.installmentTotal as number;

      if (
        !Number.isSafeInteger(number) ||
        !Number.isSafeInteger(total) ||
        total < 2 ||
        total > 48 ||
        number < 1 ||
        number > total
      ) {
        throw new Error("Parcelamento inválido");
      }
    }

    if (row.newCategoryName) {
      const name = row.newCategoryName.trim();

      if (!name || name.length > 50) {
        throw new Error("Nome de categoria inválido");
      }

      newNames.add(name);
    }
  }

  const referenceMonthYmd = input.referenceMonthYmd;

  if (referenceMonthYmd && !/^\d{4}-\d{2}-01$/.test(referenceMonthYmd)) {
    throw new Error("Mês de referência inválido");
  }

  const ledgerBalanceCents = input.ledgerBalanceCents ?? null;
  const ledgerBalanceYmd = input.ledgerBalanceYmd ?? null;

  if (
    ledgerBalanceCents !== null &&
    !Number.isSafeInteger(ledgerBalanceCents)
  ) {
    throw new Error("Saldo do extrato inválido");
  }

  if (ledgerBalanceYmd !== null && !isValidYmd(ledgerBalanceYmd)) {
    throw new Error("Data do saldo do extrato inválida");
  }

  // O extrato é a única fonte que sabe o saldo *observado* da conta numa data.
  // Gravá-lo como snapshot a cada importação é o que mantém o saldo derivado
  // ancorado na realidade, em vez de depender do valor digitado na criação da
  // conta — e é o que faz um extrato antigo, todo anterior a esse valor, parar
  // de ser silenciosamente ignorado pelo saldo.
  const anchor =
    account && !isCard && ledgerBalanceCents !== null && ledgerBalanceYmd
      ? { date: ymdToUtcDate(ledgerBalanceYmd), cents: ledgerBalanceCents }
      : null;

  // O extrato ainda é gravado quando é mais antigo que o saldo já registrado —
  // vira histórico —, mas quem manda no saldo atual é o snapshot mais recente,
  // e é só esse caso que vale anunciar de volta pra tela.
  const currentAnchorDate = account?.BalanceSnapshots[0]?.date ?? null;
  const anchorWins =
    anchor !== null &&
    (currentAnchorDate === null || currentAnchorDate <= anchor.date);

  const names = [...newNames];

  return await prisma.$transaction(async (tx) => {
    if (names.length > 0) {
      await tx.category.createMany({
        data: names.map((name) => ({ spaceId: space.id, name })),
        skipDuplicates: true,
      });
    }

    const resolved =
      names.length > 0
        ? await tx.category.findMany({
            where: { spaceId: space.id, name: { in: names } },
            select: { id: true, name: true },
          })
        : [];

    const newCategoryId = new Map(
      resolved.map((category) => [category.name, category.id]),
    );

    const created = await tx.import.create({
      data: {
        spaceId: space.id,
        importedBy: profile?.id ?? null,
        accountId: account?.id ?? null,
        creditCardId: card?.id ?? null,
        fileName,
        storagePath: null,
        type: input.type,
        status: "COMPLETED",
        referenceMonth: referenceMonthYmd
          ? ymdToUtcDate(referenceMonthYmd)
          : null,
        completedAt: new Date(),
      },
      select: { id: true },
    });

    const inserted = await tx.transaction.createManyAndReturn({
      data: rows.map((row) => ({
        spaceId: space.id,
        date: ymdToUtcDate(row.ymd),
        description: row.description.trim(),
        amount: centsToDecimal(row.amountCents),
        type: row.type,
        method: row.method,
        profileId: defaultProfileId,
        originAccountId:
          account && (row.type === "EXPENSE" || row.type === "CREDIT_CARD_PAYMENT")
            ? account.id
            : null,
        destinationAccountId:
          account && row.type === "INCOME" ? account.id : null,
        creditCardId: card?.id ?? null,
        categoryId:
          row.categoryId ??
          (row.newCategoryName
            ? (newCategoryId.get(row.newCategoryName.trim()) ?? null)
            : null),
        installmentPurchaseId: null,
        installmentNumber: row.installmentNumber,
        installmentTotal: row.installmentTotal,
        importId: created.id,
        source: "IMPORT" as const,
        hashId: row.hashId,
      })),
      skipDuplicates: true,
      select: { id: true },
    });

    if (anchor && account) {
      await tx.accountBalanceSnapshot.upsert({
        where: {
          accountId_date: { accountId: account.id, date: anchor.date },
        },
        create: {
          accountId: account.id,
          date: anchor.date,
          balance: centsToDecimal(anchor.cents),
        },
        update: { balance: centsToDecimal(anchor.cents) },
      });
    }

    return {
      importId: created.id,
      created: inserted.length,
      skipped: rows.length - inserted.length,
      balanceCents: anchorWins ? (anchor?.cents ?? null) : null,
      balanceYmd: anchorWins ? ledgerBalanceYmd : null,
    };
  });
}
