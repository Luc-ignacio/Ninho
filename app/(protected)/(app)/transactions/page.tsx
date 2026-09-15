import { AddSpaceTransaction } from "@/components/space/add-transaction";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getActiveSpace } from "@/lib/space/get-active-space";
import { getSpaceTransactions } from "@/lib/space/queries";
import { TransactionIcon } from "@hugeicons/core-free-icons";
import { notFound } from "next/navigation";
import { columns } from "./columns";

export default async function TransactionsPage() {
  const space = await getActiveSpace();

  if (!space) {
    notFound();
  }

  const { transactions } = await getSpaceTransactions(space.id);

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-6 rounded-2xl p-6 pb-12">
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xl font-medium">Transações</span>
          <span className="text-sm text-olive-600">
            Todas as movimentações do seu espaço.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <AddSpaceTransaction space={space} />
          <SidebarTrigger size="icon-lg" />
        </div>
      </div>

      {transactions.length > 0 ? (
        <DataTable columns={columns} data={transactions} />
      ) : (
        <EmptyState
          icon={TransactionIcon}
          title="Nenhuma transação ainda"
          description="Adicione sua primeira transação ou importe um extrato para começar."
          action={<AddSpaceTransaction space={space} />}
        />
      )}
    </div>
  );
}
