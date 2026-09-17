import { TransactionType } from "@/app/generated/prisma/enums";

export const TRANSACTIONS_PAGE_SIZE = 50;
export const ACCOUNT_TRANSACTIONS_PAGE_SIZE = 10;
export const ALL = "all";
export const UNCATEGORIZED = "none";

export interface SpaceTransactionFilters {
  accountId?: string | null;
  creditCardId?: string | null;
  categoryId?: string | null;
  uncategorized?: boolean;
  profileId?: string | null;
  type?: TransactionType | null;
  search?: string | null;
  startYmd?: string | null;
  endYmd?: string | null;
  take?: number;
  skip?: number;
}

export interface TransactionFilterValues {
  month: string | null;
  accountId: string | null;
  creditCardId: string | null;
  categoryId: string | null;
  profileId: string | null;
  type: TransactionType | null;
  search: string | null;
}

export const emptyTransactionFilters: TransactionFilterValues = {
  month: null,
  accountId: null,
  creditCardId: null,
  categoryId: null,
  profileId: null,
  type: null,
  search: null,
};

type SearchParams = Record<string, string | string[] | undefined>;

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

function readParam(params: SearchParams, key: string) {
  const value = params[key];
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();

  return trimmed ? trimmed : null;
}

function isTransactionType(value: string): value is TransactionType {
  return (Object.values(TransactionType) as string[]).includes(value);
}

export function parseTransactionFilters(
  params: SearchParams,
): TransactionFilterValues {
  const month = readParam(params, "month");
  const type = readParam(params, "type");

  return {
    month: month && MONTH_PATTERN.test(month) ? month : null,
    accountId: readParam(params, "account"),
    creditCardId: readParam(params, "card"),
    categoryId: readParam(params, "category"),
    profileId: readParam(params, "holder"),
    type: type && isTransactionType(type) ? type : null,
    search: readParam(params, "q"),
  };
}

export function transactionFiltersToQuery(values: TransactionFilterValues) {
  const params = new URLSearchParams();

  const entries: [string, string | null][] = [
    ["month", values.month],
    ["account", values.accountId],
    ["card", values.creditCardId],
    ["category", values.categoryId],
    ["holder", values.profileId],
    ["type", values.type],
    ["q", values.search],
  ];

  for (const [key, value] of entries) {
    if (value) {
      params.set(key, value);
    }
  }

  return params;
}

export function countActiveFilters(values: TransactionFilterValues) {
  return [...transactionFiltersToQuery(values).keys()].length;
}

export function hasActiveFilters(values: TransactionFilterValues) {
  return countActiveFilters(values) > 0;
}

export function monthRangeYmd(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);

  return {
    startYmd: new Date(Date.UTC(year, monthNumber - 1, 1))
      .toISOString()
      .slice(0, 10),
    endYmd: new Date(Date.UTC(year, monthNumber, 1)).toISOString().slice(0, 10),
  };
}

export function toQueryFilters(
  values: TransactionFilterValues,
): SpaceTransactionFilters {
  const range = values.month ? monthRangeYmd(values.month) : null;

  return {
    accountId: values.accountId,
    creditCardId: values.creditCardId,
    categoryId: values.categoryId === UNCATEGORIZED ? null : values.categoryId,
    uncategorized: values.categoryId === UNCATEGORIZED,
    profileId: values.profileId,
    type: values.type,
    search: values.search,
    startYmd: range?.startYmd ?? null,
    endYmd: range?.endYmd ?? null,
  };
}

const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatMonthLabel(month: string) {
  const label = monthFormatter.format(new Date(`${month}-01T00:00:00.000Z`));

  return label.charAt(0).toUpperCase() + label.slice(1);
}
