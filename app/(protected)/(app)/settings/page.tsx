import { DeleteSpace } from "@/components/space/delete-space";
import { UpdateSpace } from "@/components/space/update-space";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getActiveSpace } from "@/lib/space/get-active-space";
import { notFound } from "next/navigation";

export default async function SettingsPage() {
  const space = await getActiveSpace();
  if (!space) {
    notFound();
  }

  return (
    <div className="flex flex-col w-full rounded-2xl p-6 gap-6 pb-12">
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xl font-medium">Configurações</span>
          <span className="text-sm text-olive-600">
            Gerencie as preferências deste espaço.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <SidebarTrigger size="icon-lg" />
        </div>
      </div>

      <div className="space-y-6">
        <Card className=" max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>
              <h2 className="font-bold">Geral</h2>
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col flex-1 items-center justify-center gap-2">
            <UpdateSpace space={space} />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className=" max-w-3xl mx-auto border border-red-400 bg-red-50/20">
          <CardHeader>
            <CardTitle>
              <h2 className="font-bold text-destructive">Excluir Espaço</h2>
            </CardTitle>

            <CardDescription>
              Excluir este espaço remove permanentemente contas, cartões,
              categorias e transações para todos os membros.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <DeleteSpace space={space} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
