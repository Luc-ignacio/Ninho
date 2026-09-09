"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { deleteSpaceAccount } from "@/app/actions/account";
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
import { Delete02Icon, Loading03Icon } from "@hugeicons/core-free-icons";

import { Button } from "../ui/button";
import { SpaceAccountDetail } from "@/lib/space/queries";

export function DeleteSpaceAccount({
  account,
}: {
  account: SpaceAccountDetail;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const handleDelete = () =>
    startTransition(async () => {
      await deleteSpaceAccount(account.spaceId, account.id);
      router.push("/accounts");
      router.refresh();
    });

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button size="icon-lg" variant="ghost-destructive">
            <HugeiconsIcon icon={Delete02Icon} />
          </Button>
        }
      />

      <AlertDialogContent size="default">
        <AlertDialogHeader>
          <AlertDialogTitle>
            Excluir conta{" "}
            <span className="text-lime-600 font-medium">{account.name}</span>?
          </AlertDialogTitle>

          <AlertDialogDescription>
            O saldo e o histórico de saldos da conta serão perdidos. As
            transações continuam no espaço, mas deixam de estar vinculadas a
            qualquer conta. Esta ação não pode ser desfeita.
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
