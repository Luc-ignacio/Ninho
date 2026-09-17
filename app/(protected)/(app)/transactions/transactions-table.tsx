"use client";

import * as React from "react";

import { loadMoreSpaceTransactions } from "@/app/actions/transaction";
import { Button } from "@/components/ui/button";
import type { SpaceTransaction } from "@/lib/space/queries";
import {
  TRANSACTIONS_PAGE_SIZE,
  type TransactionFilterValues,
} from "@/lib/space/transaction-filters";
import { TransactionsView } from "./transactions-view";

export function TransactionsTable({
  initialTransactions,
  total,
  filters,
  pageSize = TRANSACTIONS_PAGE_SIZE,
}: {
  initialTransactions: SpaceTransaction[];
  total: number;
  filters: TransactionFilterValues;
  pageSize?: number;
}) {
  const [seed, setSeed] = React.useState(initialTransactions);
  const [rows, setRows] = React.useState(initialTransactions);
  const [isPending, startTransition] = React.useTransition();

  if (seed !== initialTransactions) {
    setSeed(initialTransactions);
    setRows(initialTransactions);
  }

  function loadMore() {
    startTransition(async () => {
      const next = await loadMoreSpaceTransactions(
        filters,
        rows.length,
        pageSize,
      );

      setRows((current) => [...current, ...next.transactions]);
    });
  }

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-4">
      <TransactionsView transactions={rows} />

      <div className="flex flex-col items-center gap-2">
        {rows.length < total ? (
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={loadMore}
            disabled={isPending}
          >
            {isPending ? "Carregando…" : "Carregar mais"}
          </Button>
        ) : null}

        <span className="text-sm text-muted-foreground">
          Mostrando {rows.length} de {total}{" "}
          {total === 1 ? "transação" : "transações"}
        </span>
      </div>
    </div>
  );
}
