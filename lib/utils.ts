import {
  AccountType,
  CurrencyType,
  ImportType,
  TransactionMethod,
  TransactionType,
} from "@/app/generated/prisma/enums";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getGreeting() {
  const now = new Date();
  const hour = now.getHours();
  let greeting;

  if (hour < 12) {
    greeting = "Bom dia";
  } else if (hour < 18) {
    greeting = "Boa tarde";
  } else {
    greeting = "Boa noite";
  }

  return greeting;
}

export function validateEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Colunas `@db.Date` voltam do Postgres como meia-noite UTC. Sem `timeZone: "UTC"`
// o Intl formata no fuso do sistema e mostra o dia anterior em BRT.
export default function formatDate(date: Date) {
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: "UTC",
  }).format(date);

  return formatted;
}

// Datas trafegam entre cliente e servidor como "YYYY-MM-DD", nunca como `Date`.
// O Prisma grava uma coluna `@db.Date` usando a data UTC do `Date` recebido, então
// uma meia-noite local vira o dia anterior em qualquer fuso positivo (ex: AUD/Sydney).

// Usa os getters locais de propósito: `toISOString()` devolveria a data UTC, que já
// é o dia seguinte a partir das 21h em BRT.
export function todayYmd() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function toYmd(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function ymdToUtcDate(ymd: string) {
  return new Date(`${ymd}T00:00:00.000Z`);
}

export function addMonthsUtc(date: Date, months: number) {
  const day = date.getUTCDate();
  const target = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1),
  );
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();

  target.setUTCDate(Math.min(day, lastDay));

  return target;
}

export function addDaysUtc(date: Date, days: number) {
  const target = new Date(date.getTime());
  target.setUTCDate(target.getUTCDate() + days);

  return target;
}

// O mês corrente sai dos getters locais pelo mesmo motivo de `todayYmd`: a partir
// das 21h do último dia do mês em BRT o UTC já virou o mês seguinte. As bordas
// são meia-noite UTC porque `date` é uma coluna `@db.Date`, e `end` é exclusivo.
export function currentMonthRangeUtc() {
  const now = new Date();

  return {
    start: new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)),
    end: new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1)),
  };
}

export function formatYmd(ymd: string) {
  const [year, month, day] = ymd.split("-");

  return `${day}/${month}/${year}`;
}

const currencyLocales: Record<CurrencyType, string> = {
  BRL: "pt-BR",
  USD: "en-US",
  AUD: "en-AU",
};

export const currencySymbol: Record<CurrencyType, string> = {
  BRL: "R$",
  USD: "U$",
  AUD: "A$",
};

export function formatCurrency(
  cents: number | null | undefined,
  currency: CurrencyType,
) {
  const formatted = new Intl.NumberFormat(currencyLocales[currency], {
    style: "currency",
    currency,
  }).format((cents ?? 0) / 100);

  if (currency === "USD") {
    return formatted.replace("$", "U$ ");
  } else if (currency === "AUD") {
    return formatted.replace("$", "A$ ");
  } else {
    return formatted;
  }
}

export function formatCurrencyCompact(
  cents: number | null | undefined,
  currency: CurrencyType,
) {
  const value = (cents ?? 0) / 100;
  const formatted = new Intl.NumberFormat(currencyLocales[currency], {
    style: "currency",
    currency,
    notation: Math.abs(value) >= 1000 ? "compact" : "standard",
    maximumFractionDigits: Math.abs(value) >= 1000 ? 1 : 0,
  }).format(value);

  if (currency === "USD") {
    return formatted.replace("$", "U$ ");
  } else if (currency === "AUD") {
    return formatted.replace("$", "A$ ");
  } else {
    return formatted;
  }
}

export function decimalToCents(
  value: { toString(): string } | null | undefined,
) {
  if (value === null || value === undefined) return 0;

  return Math.round(Number(value.toString()) * 100);
}

export function parseCurrencyInput(input: string) {
  const digits = input.replace(/\D/g, "").slice(0, 15);

  return digits ? Number(digits) : 0;
}

export function formatCents(cents: number, currency: CurrencyType) {
  const formatted = new Intl.NumberFormat(currencyLocales[currency], {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);

  return formatted;
}

export function centsToDecimal(cents: number) {
  const rounded = Math.trunc(cents);
  const sign = rounded < 0 ? "-" : "";
  const digits = Math.abs(rounded).toString().padStart(3, "0");

  return `${sign}${digits.slice(0, -2)}.${digits.slice(-2)}`;
}

export function splitInstallmentCents(
  totalCents: number,
  installments: number,
) {
  const base = Math.floor(totalCents / installments);
  const remainder = totalCents - base * installments;

  return Array.from(
    { length: installments },
    (_, index) => base + (index < remainder ? 1 : 0),
  );
}

export const accountTypeLabel: Record<AccountType, string> = {
  CHECKING: "Conta Corrente",
  SAVINGS: "Caixinha",
  INVESTMENT: "Investimento",
};

export const transactionTypeLabel: Record<TransactionType, string> = {
  INCOME: "Receita",
  EXPENSE: "Despesa",
  TRANSFER: "Transferência",
  CREDIT_CARD_PAYMENT: "Pagamento de fatura",
};

export const importTypeLabel: Record<ImportType, string> = {
  BANK_STATEMENT: "Extrato",
  CREDIT_CARD_STATEMENT: "Fatura",
};

export const transactionMethodLabel: Record<TransactionMethod, string> = {
  PIX: "Pix",
  CREDIT_CARD: "Cartão de crédito",
  DEBIT_CARD: "Cartão de débito",
  BANK_TRANSFER: "Transferência bancária",
  BOLETO: "Boleto",
  CASH: "Dinheiro",
  OTHER: "Outro",
};
