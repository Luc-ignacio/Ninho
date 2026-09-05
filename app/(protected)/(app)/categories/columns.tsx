"use client";

import * as React from "react";

import { createColumnHelper } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { type DataTableFeatures } from "@/components/ui/data-table-features";
import { deleteSpaceCategory } from "@/app/actions/category";
import type { SpaceCategory } from "@/lib/space/queries";
import { Delete02Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function CategoryActions({ category }: { category: SpaceCategory }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const handleDelete = () =>
    startTransition(async () => {
      await deleteSpaceCategory(category.spaceId, category.id);
      router.refresh();
    });

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="ghost-destructive" size="icon-sm">
            <HugeiconsIcon icon={Delete02Icon} />
          </Button>
        }
      />
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>

          <AlertDialogDescription>
            Essa ação não pode ser desfeita.
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

const columnHelper = createColumnHelper<DataTableFeatures, SpaceCategory>();

export const columns = columnHelper.columns([
  columnHelper.accessor("name", {
    header: "Categoria",
  }),
  columnHelper.accessor("_count.Transactions", {
    id: "transactions",
    header: "Transações",
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => <CategoryActions category={row.original} />,
  }),
]);
