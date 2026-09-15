import { AddSpaceCategory } from "@/components/space/add-category";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getActiveSpace } from "@/lib/space/get-active-space";
import { Tag01Icon } from "@hugeicons/core-free-icons";
import { notFound } from "next/navigation";
import { columns } from "./columns";

export default async function CategoriesPage() {
  const space = await getActiveSpace();

  if (!space) {
    notFound();
  }

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-6 rounded-2xl p-6 pb-12">
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

      {space.Categories.length ? (
        <DataTable columns={columns} data={space.Categories} />
      ) : (
        <EmptyState
          icon={Tag01Icon}
          title="Nenhuma categoria ainda"
          description="Crie categorias para organizar os gastos do espaço."
          action={<AddSpaceCategory space={space} />}
        />
      )}
    </div>
  );
}
