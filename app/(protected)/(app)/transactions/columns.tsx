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

function TransactionActions({
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
function accountLabel(transaction: SpaceTransaction) {
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

      return (
        <span className="flex items-center gap-2">
          {getValue()}
          {installmentTotal && (
            <Badge variant="outline" className="text-olive-600">
              {installmentNumber}/{installmentTotal}
            </Badge>
          )}
        </span>
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
    header: "Conta",
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
    cell: ({ row, getValue }) => {
      const transaction = row.original;
      // O valor é sempre positivo no banco; o sinal aqui é só apresentação.
      const currency =
        transaction.OriginAccount?.currency ??
        transaction.DestinationAccount?.currency ??
        transaction.CreditCard?.Account?.currency ??
        "BRL";
      const formatted = formatCurrency(getValue(), currency);

      if (transaction.type === "INCOME") {
        return <span className="font-medium text-lime-600">+{formatted}</span>;
      }

      if (transaction.type === "TRANSFER") {
        return <span className="font-medium">{formatted}</span>;
      }

      return <span className="font-medium text-red-600">−{formatted}</span>;
    },
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => <TransactionActions transaction={row.original} />,
  }),
]);
