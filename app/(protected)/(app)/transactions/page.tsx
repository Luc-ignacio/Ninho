import { AddSpaceAccount } from "@/components/space/add-account";
import { Card, CardContent } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getActiveSpace } from "@/lib/space/get-active-space";
import { TransactionIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export default async function TransactionsPage() {
  const space = await getActiveSpace();

  return (
    <div className="flex flex-col w-full rounded-2xl p-6 gap-6 pb-12">
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xl font-medium">Transações</span>
          <span className="text-sm text-olive-600">
            Todas as movimentações do seu espaço.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <AddSpaceAccount space={space} />
          <SidebarTrigger size="icon-lg" />
        </div>
      </div>

      <Card className="min-h-40">
        <CardContent className="flex flex-col flex-1 items-center justify-center space-y-4">
          <div className="p-4 bg-accent rounded-xl">
            <HugeiconsIcon icon={TransactionIcon} />
          </div>

          <div className="flex flex-col items-center">
            <span className="font-bold text-base">Nenhuma transação ainda</span>

            <span className="text-muted-foreground">
              Adicione sua primeira transação ou importe um extrato para
              começar.
            </span>
          </div>

          <AddSpaceAccount space={space} />
        </CardContent>
      </Card>
    </div>
  );
}
