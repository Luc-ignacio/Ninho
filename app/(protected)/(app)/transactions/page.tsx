import { AddSpaceTransaction } from "@/components/space/add-transaction";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getActiveSpace } from "@/lib/space/get-active-space";
import {
  getSpaceTransactionMonths,
  getSpaceTransactions,
} from "@/lib/space/queries";
import {
  parseTransactionFilters,
  toQueryFilters,
  TRANSACTIONS_PAGE_SIZE,
} from "@/lib/space/transaction-filters";
import { TransactionIcon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TransactionFilters } from "./transaction-filters";
import { TransactionsTable } from "./transactions-table";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const space = await getActiveSpace();

  if (!space) {
    notFound();
  }

  const filters = parseTransactionFilters(await searchParams);

  const [{ transactions, total }, months] = await Promise.all([
    getSpaceTransactions(space.id, {
      ...toQueryFilters(filters),
      take: TRANSACTIONS_PAGE_SIZE,
      skip: 0,
    }),
    getSpaceTransactionMonths(space.id),
  ]);

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-6 rounded-2xl p-4 pb-12 sm:p-6 sm:pb-12">
      <PageHeader
        title="Transações"
        description="Todas as movimentações do seu espaço."
        actions={
          <>
            {months.length > 0 && (
              <TransactionFilters
                accounts={space.Accounts}
                creditCards={space.CreditCards}
                categories={space.Categories}
                members={space.Members}
                months={months}
                values={filters}
              />
            )}
            <AddSpaceTransaction
              space={space}
              className="flex-1 sm:flex-none"
            />
          </>
        }
      />

      {months.length === 0 ? (
        <EmptyState
          icon={TransactionIcon}
          title="Nenhuma transação ainda"
          description="Adicione sua primeira transação ou importe um extrato para começar."
          action={<AddSpaceTransaction space={space} />}
        />
      ) : (
        <>
          {transactions.length > 0 ? (
            <TransactionsTable
              initialTransactions={transactions}
              total={total}
              filters={filters}
            />
          ) : (
            <EmptyState
              icon={TransactionIcon}
              title="Nenhuma transação encontrada"
              description="Ajuste os filtros para ver outras transações."
              action={
                <Link href="/transactions">
                  <Button variant="outline">Limpar filtros</Button>
                </Link>
              }
            />
          )}
        </>
      )}
    </div>
  );
}
