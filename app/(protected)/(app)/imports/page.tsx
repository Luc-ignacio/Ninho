import { notFound } from "next/navigation";

import ImportsHistory from "@/app/(protected)/(app)/imports/imports-history";
import ImportWizard from "@/components/import/import-wizard";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getActiveSpace } from "@/lib/space/get-active-space";
import { getSpaceImports } from "@/lib/space/queries";
import { Upload01Icon } from "@hugeicons/core-free-icons";

export default async function ImportsPage() {
  const space = await getActiveSpace();

  if (!space) notFound();

  const imports = await getSpaceImports(space.id);

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-6 rounded-2xl p-6 pb-12">
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xl font-medium">Importações</span>
          <span className="text-sm text-olive-600">
            Importe extratos e faturas para organizar suas transações.
          </span>
        </div>

        <div className="flex items-center gap-2">
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

          <ImportWizard space={space} />
        </CardContent>
      </Card>

      {imports.length > 0 ? (
        <ImportsHistory imports={imports} />
      ) : (
        <EmptyState
          icon={Upload01Icon}
          title="Nenhuma importação ainda"
          description="Os extratos e faturas importados vão aparecer aqui."
        />
      )}
    </div>
  );
}
