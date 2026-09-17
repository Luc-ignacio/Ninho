import { AdjustAccountBalance } from "@/components/space/adjust-account-balance";
import { DeleteSpaceAccount } from "@/components/space/delete-account";
import { AddSpaceTransaction } from "@/components/space/add-transaction";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";

import { PageHeader } from "@/components/ui/page-header";
import { getActiveSpace } from "@/lib/space/get-active-space";
import { getSpaceAccountById, getSpaceTransactions } from "@/lib/space/queries";
import {
  ACCOUNT_TRANSACTIONS_PAGE_SIZE,
  emptyTransactionFilters,
} from "@/lib/space/transaction-filters";
import { accountTypeLabel, formatCurrency, formatYmd } from "@/lib/utils";
import { ArrowLeft02Icon, TransactionIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TransactionsTable } from "../../transactions/transactions-table";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const space = await getActiveSpace();

  if (!space) {
    notFound();
  }

  const account = await getSpaceAccountById(id, space.id);

  if (!account) {
    notFound();
  }

  const { transactions, total } = await getSpaceTransactions(space.id, {
    accountId: account.id,
    take: ACCOUNT_TRANSACTIONS_PAGE_SIZE,
  });

  // `@db.Date` à meia-noite UTC: `toYmd` usaria os getters locais e mostraria o
  // dia anterior em BRT.
  const balanceYmd =
    account.BalanceSnapshots[0]?.date.toISOString().slice(0, 10) ?? null;

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-6 rounded-2xl p-4 pb-12 sm:p-6 sm:pb-12">
      <PageHeader
        title={account.name}
        description={`${accountTypeLabel[account.type]} • ${account.currency}`}
        back={
          <Link href="/accounts" className="w-fit">
            <Button variant="ghost" className="-ml-3.5">
              <HugeiconsIcon icon={ArrowLeft02Icon} />
              Contas
            </Button>
          </Link>
        }
        actions={
          <>
            <AddSpaceTransaction
              space={space}
              defaultAccountId={account.id}
              className="flex-1 sm:flex-none"
            />
            <DeleteSpaceAccount account={account} />
          </>
        }
      />

      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Item variant="outline" className="bg-white shadow-md">
            <ItemContent className="flex flex-col gap-4">
              <ItemDescription>Saldo atual</ItemDescription>
              <span className="text-2xl font-semibold">
                {formatCurrency(account.balanceCents, account.currency)}
              </span>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <ItemDescription>
                  {balanceYmd
                    ? `Registrado em ${formatYmd(balanceYmd)} e somado aos lançamentos posteriores`
                    : "Somado a partir de todos os lançamentos da conta"}
                </ItemDescription>

                <AdjustAccountBalance account={account} />
              </div>
            </ItemContent>
          </Item>

          <Item variant="outline" className="bg-white shadow-md">
            <ItemContent className="flex flex-col gap-4">
              <div className="space-y-2">
                <ItemTitle className="text-base font-semibold">
                  Informações da conta
                </ItemTitle>

                <div className="flex items-center justify-between gap-4">
                  <ItemDescription>Instituição</ItemDescription>
                  <span className="min-w-0 truncate text-right font-semibold">
                    {account.name}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <ItemDescription>Tipo</ItemDescription>
                  <span className="min-w-0 truncate text-right font-semibold">
                    {accountTypeLabel[account.type]}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <ItemDescription>Moeda</ItemDescription>
                  <span className="min-w-0 truncate text-right font-semibold">
                    {account.currency}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <ItemDescription>Titular</ItemDescription>
                  <span className="min-w-0 truncate text-right font-semibold">
                    {account.Profile?.name}
                  </span>
                </div>
              </div>
            </ItemContent>
          </Item>
        </div>

        <div className="space-y-6">
          <h2 className="font-bold">Transações</h2>

          {transactions.length > 0 ? (
            <TransactionsTable
              initialTransactions={transactions}
              total={total}
              filters={{ ...emptyTransactionFilters, accountId: account.id }}
              pageSize={ACCOUNT_TRANSACTIONS_PAGE_SIZE}
            />
          ) : (
            <EmptyState
              icon={TransactionIcon}
              title="Nenhuma transação ainda"
              description="Adicione sua primeira transação ou importe um extrato para começar."
              action={
                <AddSpaceTransaction
                  space={space}
                  defaultAccountId={account.id}
                />
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
