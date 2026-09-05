import { AddSpaceAccount } from "@/components/space/add-account";
import { ImportDropZone } from "@/components/import/import-drop-zone";
import { Card, CardContent } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getActiveSpace } from "@/lib/space/get-active-space";
import { Upload01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export default async function ImportsPage() {
  const space = await getActiveSpace();

  return (
    <div className="flex flex-col w-full rounded-2xl p-6 gap-6 pb-12">
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xl font-medium">Importações</span>
          <span className="text-sm text-olive-600">
            Importe extratos e faturas para organizar suas transações.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <AddSpaceAccount space={space} />
          <SidebarTrigger size="icon-lg" />
        </div>
      </div>

      <Card className="min-h-40">
        <CardContent className="flex flex-col flex-1 items-center justify-center space-y-4">
          <div className="flex flex-col items-center">
            <span className="font-bold text-base">
              Importe seu extrato ou fatura
            </span>

            <span className="text-muted-foreground">
              Envie um arquivo para que o Ninho identifique e organize suas
              transações automaticamente.
            </span>
          </div>

          <ImportDropZone className="max-w-xl" />
        </CardContent>
      </Card>

      <Card className="min-h-40 bg-accent">
        <CardContent className="flex flex-col flex-1 items-center justify-center space-y-4">
          <div className="p-4 bg-white rounded-xl">
            <HugeiconsIcon icon={Upload01Icon} />
          </div>

          <div className="flex flex-col items-center">
            <span className="font-bold text-base">
              Nenhuma importação ainda
            </span>

            <span className="text-muted-foreground">
              Os extratos e faturas importados vão aparecer aqui.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
