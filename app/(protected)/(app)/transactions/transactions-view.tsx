"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import type { SpaceTransaction } from "@/lib/space/queries";
import {
  formatYmd,
  transactionMethodLabel,
  transactionTypeLabel,
} from "@/lib/utils";
import {
  accountLabel,
  columns,
  TransactionActions,
  TransactionAmount,
} from "./columns";

function TransactionCard({ transaction }: { transaction: SpaceTransaction }) {
  const { installmentNumber, installmentTotal, Category, Profile } =
    transaction;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="wrap-break-word font-medium">
              {transaction.description}
            </span>

            {installmentTotal && (
              <Badge variant="outline" className="shrink-0 text-olive-600">
                {installmentNumber}/{installmentTotal}
              </Badge>
            )}
          </div>

          <span className="wrap-break-word text-xs text-olive-600">
            {formatYmd(transaction.date)} • {accountLabel(transaction)}
          </span>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <TransactionAmount transaction={transaction} />
          <TransactionActions transaction={transaction} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {(transaction.type === "TRANSFER" ||
          transaction.type === "CREDIT_CARD_PAYMENT") && (
          <Badge variant="secondary">
            {transactionTypeLabel[transaction.type]}
          </Badge>
        )}

        <Badge variant="secondary">
          {transactionMethodLabel[transaction.method]}
        </Badge>

        {Category?.name && (
          <Badge variant="outline" className="text-olive-600">
            {Category.name}
          </Badge>
        )}

        {Profile?.name && (
          <Badge variant="outline" className="text-olive-600">
            {Profile.name}
          </Badge>
        )}
      </div>
    </div>
  );
}

export function TransactionsView({
  transactions,
}: {
  transactions: SpaceTransaction[];
}) {
  return (
    <>
      <div className="flex flex-col gap-3 md:hidden">
        {transactions.map((transaction) => (
          <TransactionCard key={transaction.id} transaction={transaction} />
        ))}
      </div>

      <div className="hidden min-w-0 md:block">
        <DataTable columns={columns} data={transactions} />
      </div>
    </>
  );
}
