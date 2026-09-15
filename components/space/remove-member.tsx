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
import { Delete02Icon, Loading03Icon } from "@hugeicons/core-free-icons";

import { Button } from "../ui/button";
import { ActiveSpace } from "@/lib/space/get-active-space";
import { SpaceMember } from "@/lib/space/queries";
import { removeSpaceMember } from "@/app/actions/space-member";

export function RemoveSpaceMember({
  space,
  spaceMember,
}: {
  space: ActiveSpace;
  spaceMember: SpaceMember;
}) {
  if (!space) {
    notFound();
  }

  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const handleDelete = () =>
    startTransition(async () => {
      await removeSpaceMember(spaceMember.id);
      setOpen(false);
      router.refresh();
    });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button size="icon-sm" variant="ghost-destructive">
            <HugeiconsIcon icon={Delete02Icon} />
          </Button>
        }
      />

      <AlertDialogContent size="default">
        <AlertDialogHeader>
          <AlertDialogTitle>
            Remover {spaceMember.Profile.name} do espaço{" "}
            <span className="text-lime-600 font-medium">{space.name}</span>?
          </AlertDialogTitle>

          <AlertDialogDescription>
            {spaceMember.Profile.name} perderá acesso a contas, cartões e
            transações deste espaço. Isso não afeta seus dados em outros
            espaços.
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
              "Remover"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
