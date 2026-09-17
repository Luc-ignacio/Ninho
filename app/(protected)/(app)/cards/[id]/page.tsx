import { AddSpaceTransaction } from "@/components/space/add-transaction";
import { DeleteSpaceCreditCard } from "@/components/space/delete-credit-card";
import { EditSpaceCreditCard } from "@/components/space/edit-credit-card";
import { RestoreSpaceCreditCard } from "@/components/space/restore-credit-card";
import { Badge } from "@/components/ui/badge";
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
import {
  getSpaceCreditCardById,
  getSpaceTransactions,
} from "@/lib/space/queries";
import {
  ACCOUNT_TRANSACTIONS_PAGE_SIZE,
  emptyTransactionFilters,
} from "@/lib/space/transaction-filters";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft02Icon, TransactionIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TransactionsTable } from "../../transactions/transactions-table";

export default async function CardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const space = await getActiveSpace();

  if (!space) {
    notFound();
  }

  const creditCard = await getSpaceCreditCardById(id, space.id);

  if (!creditCard) {
    notFound();
  }

  const { transactions, total } = await getSpaceTransactions(space.id, {
    creditCardId: creditCard.id,
    take: ACCOUNT_TRANSACTIONS_PAGE_SIZE,
  });

  const currency = creditCard.Account?.currency ?? "BRL";
  const { creditLimitCents, usedCents, availableCents } = creditCard;
  const isExceeded = (availableCents ?? 0) < 0;
  const usedPercent =
    creditLimitCents === null || creditLimitCents === 0
      ? 0
      : Math.min(
          100,
          Math.max(0, Math.round((usedCents / creditLimitCents) * 100)),
        );

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-6 rounded-2xl p-4 pb-12 sm:p-6 sm:pb-12">
      <PageHeader
        title={creditCard.name}
        badge={
          !creditCard.isActive && <Badge variant="secondary">Arquivado</Badge>
        }
        description={`•••• ${creditCard.lastFour ?? "••••"}${
          creditCard.Account?.name ? ` • ${creditCard.Account.name}` : ""
        }`}
        back={
          <Link href="/cards" className="w-fit">
            <Button variant="ghost" className="-ml-3.5">
              <HugeiconsIcon icon={ArrowLeft02Icon} />
              Cartões
            </Button>
          </Link>
        }
        actions={
          <>
            <AddSpaceTransaction
              space={space}
              className="flex-1 sm:flex-none"
            />
            {creditCard.isActive ? (
              <>
                <EditSpaceCreditCard space={space} creditCard={creditCard} />
                <DeleteSpaceCreditCard creditCard={creditCard} />
              </>
            ) : (
              <RestoreSpaceCreditCard creditCard={creditCard} />
            )}
          </>
        }
      />

      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Item variant="outline" className="bg-white shadow-md">
            <ItemContent className="flex flex-col gap-4">
              <ItemDescription>Fatura em aberto</ItemDescription>
              <span className="text-2xl font-semibold">
                {formatCurrency(usedCents, currency)}
              </span>

              {creditLimitCents === null ? (
                <ItemDescription>Sem limite cadastrado</ItemDescription>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${isExceeded ? "bg-red-500" : "bg-lime-600"}`}
                      style={{ width: `${usedPercent}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <ItemDescription>
                      Limite de {formatCurrency(creditLimitCents, currency)}
                    </ItemDescription>

                    <span
                      className={
                        isExceeded
                          ? "text-sm font-semibold text-red-600"
                          : "text-sm text-muted-foreground"
                      }
                    >
                      {isExceeded
                        ? "Limite excedido"
                        : `${formatCurrency(availableCents, currency)} disponível`}
                    </span>
                  </div>
                </div>
              )}
            </ItemContent>
          </Item>

          <Item variant="outline" className="bg-white shadow-md">
            <ItemContent className="flex flex-col gap-4">
              <div className="space-y-2">
                <ItemTitle className="text-base font-semibold">
                  Informações do cartão
                </ItemTitle>

                <div className="flex items-center justify-between gap-4">
                  <ItemDescription>Titular</ItemDescription>
                  <span className="min-w-0 truncate text-right font-semibold">
                    {creditCard.Holder?.name ?? "Sem titular"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <ItemDescription>Conta de pagamento</ItemDescription>
                  <span className="min-w-0 truncate text-right font-semibold">
                    {creditCard.Account?.name ?? "Não vinculada"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <ItemDescription>Vencimento</ItemDescription>
                  <span className="min-w-0 truncate text-right font-semibold">
                    {creditCard.dueDay
                      ? `Dia ${creditCard.dueDay}`
                      : "Não informado"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <ItemDescription>Parcelamentos</ItemDescription>
                  <span className="min-w-0 truncate text-right font-semibold">
                    {creditCard._count.InstallmentPurchases}
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
              filters={{
                ...emptyTransactionFilters,
                creditCardId: creditCard.id,
              }}
              pageSize={ACCOUNT_TRANSACTIONS_PAGE_SIZE}
            />
          ) : (
            <EmptyState
              icon={TransactionIcon}
              title="Nenhuma transação ainda"
              description="Os lançamentos feitos nesse cartão aparecem aqui."
              action={<AddSpaceTransaction space={space} />}
            />
          )}
        </div>
      </div>
    </div>
  );
}
