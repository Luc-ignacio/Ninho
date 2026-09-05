import { AddSpaceCategory } from "@/components/space/add-category";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getActiveSpace } from "@/lib/space/get-active-space";
import { getSpaceCategories } from "@/lib/space/queries";
import { Tag01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { notFound } from "next/navigation";
import { columns } from "./columns";

export default async function CategoriesPage() {
  const space = await getActiveSpace();

  if (!space) {
    notFound();
  }

  const categories = await getSpaceCategories(space.id);

  return (
    <div className="flex flex-col w-full rounded-2xl p-6 gap-6 pb-12">
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xl font-medium">Categorias</span>
          <span className="text-sm text-olive-600">
            Organize seus gastos por categoria.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <AddSpaceCategory space={space} />
          <SidebarTrigger size="icon-lg" />
        </div>
      </div>

      {categories.length ? (
        <DataTable columns={columns} data={categories} />
      ) : (
        <Card className="min-h-40">
          <CardContent className="flex flex-col flex-1 items-center justify-center space-y-4">
            <div className="p-4 bg-accent rounded-xl">
              <HugeiconsIcon icon={Tag01Icon} />
            </div>

            <div className="flex flex-col items-center">
              <span className="font-bold text-base">
                Nenhuma categoria ainda
              </span>

              <span className="text-muted-foreground">
                Crie categorias para organizar os gastos do espaço.
              </span>
            </div>

            <AddSpaceCategory space={space} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
