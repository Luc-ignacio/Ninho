"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { deleteSpaceCreditCard } from "@/app/actions/credit-card";
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
} from "../ui/alert-dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Archive02Icon,
  Delete02Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "../ui/button";
import { SpaceCreditCard } from "@/lib/space/queries";

export function DeleteSpaceCreditCard({
  creditCard,
  className,
}: {
  creditCard: SpaceCreditCard;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const hasHistory =
    creditCard._count.Transactions > 0 ||
    creditCard._count.InstallmentPurchases > 0;

  const handleDelete = () =>
    startTransition(async () => {
      await deleteSpaceCreditCard(creditCard.id);
      setOpen(false);
      router.refresh();
    });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button size="icon-sm" variant="ghost" className={className}>
            <HugeiconsIcon icon={hasHistory ? Archive02Icon : Delete02Icon} />
          </Button>
        }
      />

      <AlertDialogContent size="default">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {hasHistory ? "Arquivar cartão " : "Excluir cartão "}
            <span className="text-lime-600 font-medium">{creditCard.name}</span>
            ?
          </AlertDialogTitle>

          <AlertDialogDescription>
            {hasHistory
              ? "O cartão tem lançamentos, então ele será arquivado em vez de excluído: some das opções ao criar uma transação, mas as despesas, parcelas e o histórico de fatura continuam intactos. Você pode reativá-lo depois."
              : "O cartão não tem nenhum lançamento e será excluído definitivamente. Esta ação não pode ser desfeita."}
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
            ) : hasHistory ? (
              "Arquivar"
            ) : (
              "Excluir"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
