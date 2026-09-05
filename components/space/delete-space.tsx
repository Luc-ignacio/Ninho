"use client";

import * as React from "react";
import { notFound, useRouter } from "next/navigation";
import { deleteSpace } from "@/app/actions/space";
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
import { Loading03Icon } from "@hugeicons/core-free-icons";

import { Button } from "../ui/button";
import { ActiveSpace } from "@/lib/space/get-active-space";

export function DeleteSpace({ space }: { space: ActiveSpace }) {
  if (!space) {
    notFound();
  }

  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const handleDelete = () =>
    startTransition(async () => {
      await deleteSpace(space?.id);
      router.push("/");
      router.refresh();
    });

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="outline-destructive">Excluir Espaço</Button>}
      />

      <AlertDialogContent size="default">
        <AlertDialogHeader>
          <AlertDialogTitle>
            Excluir espaço{" "}
            <span className="text-lime-600 font-medium">{space.name}</span>?
          </AlertDialogTitle>

          <AlertDialogDescription>
            Todas as contas, cartões, categorias e transações deste espaço serão
            perdidas para todos os membros. Esta ação não pode ser desfeita.
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
