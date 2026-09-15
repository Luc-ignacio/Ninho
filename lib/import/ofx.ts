import { parseSync } from "ofx-js";

import { ymdToUtcDate } from "@/lib/utils";
import { decodeStatementBytes } from "@/lib/import/decode";
import { stripAccountTail } from "@/lib/import/normalize";
import type { ParsedStatement, ParsedTransaction } from "@/lib/import/types";

const MAX_DESCRIPTION_LENGTH = 200;

type OfxNode = Record<string, unknown>;

function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];

  return Array.isArray(value) ? value : [value];
}

function asNode(value: unknown): OfxNode | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as OfxNode)
    : null;
}

function asText(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }

  return null;
}

export function ofxDateToYmd(value: unknown): string | null {
  const text = asText(value);
  if (!text) return null;

  const digits = text.slice(0, 8);
  if (!/^\d{8}$/.test(digits)) return null;

  const ymd = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  const date = ymdToUtcDate(ymd);

  return Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== ymd
    ? null
    : ymd;
}

export function ofxSignedAmountToCents(value: unknown): number | null {
  const text = asText(value);
  if (!text) return null;

  const cleaned = text.replace(/\s/g, "");
  const normalized =
    cleaned.includes(",") && !cleaned.includes(".")
      ? cleaned.replace(",", ".")
      : cleaned.replace(/,/g, "");

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;

  return Math.round(parsed * 100);
}

export function ofxAmountToCents(value: unknown): number | null {
  const signed = ofxSignedAmountToCents(value);

  return signed === null ? null : Math.abs(signed);
}

function readDescription(transaction: OfxNode) {
  const name = asText(transaction.NAME);
  const payee = asText(asNode(transaction.PAYEE)?.NAME);
  const memo = asText(transaction.MEMO);
  const primary = name ?? payee ?? memo;

  if (!primary) return null;

  if (memo && memo !== primary && !primary.includes(memo)) {
    return `${primary} — ${memo}`;
  }

  return primary;
}

function firstOfMonth(ymd: string) {
  return `${ymd.slice(0, 7)}-01`;
}

// `LEDGERBAL` é o saldo contábil da conta no fim de `DTASOF` — a única âncora
// confiável de saldo que o arquivo carrega. Bancos que omitem o `DTASOF` sempre
// mandam o saldo do fim do período, daí o fallback.
function readLedgerBalance(statement: OfxNode, fallbackYmd: string | null) {
  const ledger = asNode(statement.LEDGERBAL);
  const balanceCents = ledger
    ? ofxSignedAmountToCents(ledger.BALAMT)
    : null;

  if (balanceCents === null) return { balanceCents: null, ymd: null };

  const ymd = ofxDateToYmd(ledger?.DTASOF) ?? fallbackYmd;

  return ymd ? { balanceCents, ymd } : { balanceCents: null, ymd: null };
}

function mapTransaction(node: OfxNode): ParsedTransaction | null {
  const ymd = ofxDateToYmd(node.DTPOSTED);
  if (!ymd) return null;

  const signedText = asText(node.TRNAMT);
  const amountCents = ofxAmountToCents(node.TRNAMT);
  if (amountCents === null || amountCents === 0) return null;

  const rawDescription = readDescription(node);
  if (!rawDescription) return null;

  if (/^saldo\b/i.test(rawDescription)) return null;

  return {
    fitid: asText(node.FITID),
    ymd,
    amountCents,
    direction: signedText?.startsWith("-") ? "OUT" : "IN",
    description: stripAccountTail(rawDescription).slice(
      0,
      MAX_DESCRIPTION_LENGTH,
    ),
    rawDescription,
    memo: asText(node.MEMO),
    trntype: asText(node.TRNTYPE)?.toUpperCase() ?? "OTHER",
  };
}

export function parseOfx(bytes: Uint8Array): ParsedStatement {
  const text = decodeStatementBytes(bytes);

  if (!text.includes("<OFX>")) {
    throw new Error("Arquivo OFX inválido ou corrompido");
  }

  let root: OfxNode;

  try {
    root = (parseSync(text).OFX ?? {}) as OfxNode;
  } catch {
    throw new Error("Não foi possível ler o arquivo OFX");
  }

  const cardStatements = toArray(
    asNode(root.CREDITCARDMSGSRSV1)?.CCSTMTTRNRS as OfxNode | OfxNode[],
  )
    .map((response) => asNode(response.CCSTMTRS))
    .filter((statement): statement is OfxNode => statement !== null);

  const bankStatements = toArray(
    asNode(root.BANKMSGSRSV1)?.STMTTRNRS as OfxNode | OfxNode[],
  )
    .map((response) => asNode(response.STMTRS))
    .filter((statement): statement is OfxNode => statement !== null);

  const isCard = cardStatements.length > 0;
  const statements = isCard ? cardStatements : bankStatements;

  if (statements.length === 0) {
    throw new Error("O arquivo não contém um extrato ou fatura");
  }

  if (statements.length > 1) {
    throw new Error(
      "O arquivo contém mais de uma conta; exporte um extrato por conta",
    );
  }

  const statement = statements[0];
  const account = asNode(
    isCard ? statement.CCACCTFROM : statement.BANKACCTFROM,
  );
  const list = asNode(statement.BANKTRANLIST);

  const nodes = toArray(list?.STMTTRN as OfxNode | OfxNode[]);
  const transactions: ParsedTransaction[] = [];
  let skipped = 0;

  for (const node of nodes) {
    const mapped = asNode(node) ? mapTransaction(node) : null;

    if (mapped) {
      transactions.push(mapped);
    } else {
      skipped += 1;
    }
  }

  const periodStartYmd = ofxDateToYmd(list?.DTSTART);
  const periodEndYmd = ofxDateToYmd(list?.DTEND);
  const lastYmd = transactions.reduce<string | null>(
    (latest, transaction) =>
      latest === null || transaction.ymd > latest ? transaction.ymd : latest,
    null,
  );

  const reference = periodEndYmd ?? lastYmd;

  // A fatura do cartão também traz `LEDGERBAL`, mas ele é o total devido, não o
  // saldo de uma conta — ancorar por ele quebraria o saldo de quem paga.
  const ledger = isCard
    ? { balanceCents: null, ymd: null }
    : readLedgerBalance(statement, reference);

  return {
    type: isCard ? "CREDIT_CARD_STATEMENT" : "BANK_STATEMENT",
    acctId: asText(account?.ACCTID),
    bankId: asText(account?.BANKID),
    currency: asText(statement.CURDEF)?.toUpperCase() ?? null,
    periodStartYmd,
    periodEndYmd,
    referenceMonthYmd: reference ? firstOfMonth(reference) : null,
    ledgerBalanceCents: ledger.balanceCents,
    ledgerBalanceYmd: ledger.ymd,
    transactions,
    skipped,
  };
}
