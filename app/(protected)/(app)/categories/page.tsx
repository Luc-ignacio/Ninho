import { AddSpaceCategory } from "@/components/space/add-category";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
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
    <div className="flex w-full min-w-0 max-w-full flex-col gap-6 rounded-2xl p-4 pb-12 sm:p-6 sm:pb-12">
      <PageHeader
        title="Categorias"
        description="Organize seus gastos por categoria."
        actions={
          <AddSpaceCategory space={space} className="flex-1 sm:flex-none" />
        }
      />

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
