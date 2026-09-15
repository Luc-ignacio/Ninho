import type { ImportType } from "@/app/generated/prisma/enums";

export type StatementDirection = "IN" | "OUT";

export interface ParsedTransaction {
  fitid: string | null;
  ymd: string;
  amountCents: number;
  direction: StatementDirection;
  description: string;
  rawDescription: string;
  memo: string | null;
  trntype: string;
}

export interface ParsedStatement {
  type: ImportType;
  acctId: string | null;
  bankId: string | null;
  currency: string | null;
  periodStartYmd: string | null;
  periodEndYmd: string | null;
  referenceMonthYmd: string | null;
  ledgerBalanceCents: number | null;
  ledgerBalanceYmd: string | null;
  transactions: ParsedTransaction[];
  skipped: number;
}
