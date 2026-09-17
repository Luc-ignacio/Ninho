"use client";

import * as React from "react";

import { deleteSpaceTransaction } from "@/app/actions/transaction";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type DataTableFeatures } from "@/components/ui/data-table-features";
import type { SpaceTransaction } from "@/lib/space/queries";
import {
  formatCurrency,
  formatYmd,
  transactionMethodLabel,
  transactionTypeLabel,
} from "@/lib/utils";
import { Delete02Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createColumnHelper } from "@tanstack/react-table";
import { useRouter } from "next/navigation";

export function TransactionActions({
  transaction,
}: {
  transaction: SpaceTransaction;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const handleDelete = () =>
    startTransition(async () => {
      await deleteSpaceTransaction(transaction.id);
      setOpen(false);
      router.refresh();
    });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button variant="ghost-destructive" size="icon-sm">
            <HugeiconsIcon icon={Delete02Icon} />
          </Button>
        }
      />
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {transaction.installmentTotal
              ? "Excluir compra parcelada?"
              : "Excluir transação?"}
          </AlertDialogTitle>

          <AlertDialogDescription>
            {transaction.installmentTotal
              ? `Essa ação não pode ser desfeita e exclui as ${transaction.installmentTotal} parcelas da compra.`
              : "Essa ação não pode ser desfeita e os saldos serão recalculados."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">Cancelar</AlertDialogCancel>

          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={handleDelete}
          >
            {isPending ? (
              <div className="animate-spin">
                <HugeiconsIcon icon={Loading03Icon} />
              </div>
            ) : (
              "Excluir"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Uma despesa no cartão não movimenta conta nenhuma, então mostra o cartão.
export function accountLabel(transaction: SpaceTransaction) {
  const { OriginAccount, DestinationAccount, CreditCard } = transaction;

  if (OriginAccount && DestinationAccount) {
    return `${OriginAccount.name} → ${DestinationAccount.name}`;
  }

  if (OriginAccount) return OriginAccount.name;
  if (DestinationAccount) return DestinationAccount.name;

  if (CreditCard) {
    return CreditCard.lastFour
      ? `${CreditCard.name} •••• ${CreditCard.lastFour}`
      : CreditCard.name;
  }

  return "—";
}

export function TransactionAmount({
  transaction,
}: {
  transaction: SpaceTransaction;
}) {
  // O valor é sempre positivo no banco; o sinal aqui é só apresentação.
  const currency =
    transaction.OriginAccount?.currency ??
    transaction.DestinationAccount?.currency ??
    transaction.CreditCard?.Account?.currency ??
    "BRL";
  const formatted = formatCurrency(transaction.amountCents, currency);

  if (transaction.type === "INCOME") {
    return <span className="font-medium text-lime-600">+{formatted}</span>;
  }

  if (transaction.type === "TRANSFER") {
    return <span className="font-medium">{formatted}</span>;
  }

  return <span className="font-medium text-red-600">−{formatted}</span>;
}

const columnHelper = createColumnHelper<DataTableFeatures, SpaceTransaction>();

export const columns = columnHelper.columns([
  columnHelper.accessor("date", {
    header: "Data",
    cell: ({ getValue }) => formatYmd(getValue()),
  }),
  columnHelper.accessor("description", {
    header: "Descrição",
    cell: ({ row, getValue }) => {
      const { installmentNumber, installmentTotal } = row.original;
      const description = getValue();

      return (
        <div className="flex max-w-[22ch] items-center gap-2 whitespace-normal xl:max-w-[36ch]">
          <span className="line-clamp-3 wrap-break-word" title={description}>
            {description}
          </span>

          {installmentTotal && (
            <Badge variant="outline" className="shrink-0 text-olive-600">
              {installmentNumber}/{installmentTotal}
            </Badge>
          )}
        </div>
      );
    },
  }),
  columnHelper.accessor("type", {
    header: "Tipo",
    cell: ({ getValue }) => (
      <Badge variant="secondary">{transactionTypeLabel[getValue()]}</Badge>
    ),
  }),
  columnHelper.accessor((row) => row.Category?.name ?? "—", {
    id: "category",
    header: "Categoria",
  }),
  columnHelper.accessor(accountLabel, {
    id: "account",
    header: "Conta/Cartão",
    cell: ({ row }) => {
      const { OriginAccount, DestinationAccount, CreditCard } = row.original;

      const [primary, secondary] =
        OriginAccount && DestinationAccount
          ? [OriginAccount.name, `→ ${DestinationAccount.name}`]
          : CreditCard
            ? [
                CreditCard.name,
                CreditCard.lastFour ? `•••• ${CreditCard.lastFour}` : null,
              ]
            : [OriginAccount?.name ?? DestinationAccount?.name ?? "—", null];

      return (
        <div className="flex max-w-[16ch] flex-col whitespace-normal wrap-break-word xl:max-w-[22ch]">
          <span>{primary}</span>
          {secondary && <span className="text-olive-600">{secondary}</span>}
        </div>
      );
    },
  }),
  columnHelper.accessor((row) => transactionMethodLabel[row.method], {
    id: "method",
    header: "Forma",
  }),
  columnHelper.accessor((row) => row.Profile?.name ?? "—", {
    id: "profile",
    header: "Responsável",
  }),
  columnHelper.accessor("amountCents", {
    header: "Valor",
    cell: ({ row }) => <TransactionAmount transaction={row.original} />,
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => <TransactionActions transaction={row.original} />,
  }),
]);
