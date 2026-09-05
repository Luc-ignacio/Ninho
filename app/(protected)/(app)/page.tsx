import { AddSpaceAccount } from "@/components/space/add-account";
import { CreateSpace } from "@/components/space/create-space";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getActiveProfile } from "@/lib/auth/get-active-profile";
import { getActiveSpace } from "@/lib/space/get-active-space";
import { cn, getGreeting } from "@/lib/utils";
import {
  TradeDownIcon,
  TradeUpIcon,
  TrendingDown,
  TrendingUp,
  TrendingUpDownIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const greeting = getGreeting();
  const profile = await getActiveProfile();
  const space = await getActiveSpace();

  if (!space) {
    redirect("/onboarding");
  }

  const stats = [
    {
      id: "saldo-total",
      title: "Saldo Total",
      content: "R$0,00",
      contentClass: "text-muted-foreground",
      footer: null,
      footerIcon: null,
      footerClass: "text-green-600",
    },
    {
      id: "receitas",
      title: "Receitas",
      content: "R$0,00",
      contentClass: "text-muted-foreground",
      footer: null,
      footerIcon: null,
      footerClass: "text-red-600",
    },
    {
      id: "gastos",
      title: "Gastos",
      content: "R$0,00",
      contentClass: "text-muted-foreground",
      footer: null,
      footerIcon: null,
      footerClass: "text-green-600",
    },
    {
      id: "saldo-do-mes",
      title: "Saldo Do Mês",
      content: "R$0,00",
      contentClass: "text-muted-foreground",
      footer: null,
      footerIcon: null,
      footerClass: "text-muted-foreground",
    },
  ];

  return (
    <div className="flex flex-col w-full rounded-2xl p-6 gap-6 pb-12">
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm text-olive-600">{`${greeting},`}</span>
          <span className="text-xl font-medium">{profile?.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <CreateSpace />
          <SidebarTrigger size="icon-lg" />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {stats.map((stat) => {
          return (
            <Card key={stat.id} size="sm">
              <CardContent className="flex flex-col gap-2">
                <span className="font-medium">{stat.title}</span>

                <span className={cn(stat.contentClass, "text-3xl font-bold")}>
                  {stat.content}
                </span>

                <div
                  className={cn(
                    stat.footerClass,
                    "flex items-center gap-1 text-xs",
                  )}
                >
                  {stat.footerIcon}
                  {stat.footer}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="min-h-40">
        <CardContent className="flex flex-col flex-1 items-center justify-center">
          <span className="font-bold text-base">Gastos do mês</span>

          <span className="text-muted-foreground">
            Ainda não há gastos registrados neste espaço.
          </span>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card className="min-h-40">
          <CardContent className="flex flex-col flex-1 items-center justify-center">
            <span className="font-bold text-base">Gastos por categoria</span>

            <span className="text-muted-foreground">Sem dados ainda.</span>
          </CardContent>
        </Card>

        <Card className="min-h-40">
          <CardContent className="flex flex-col flex-1 items-center justify-center">
            <span className="font-bold text-base">Gastos por pessoa</span>

            <span className="text-muted-foreground">Sem dados ainda.</span>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <h2 className="font-bold">Contas</h2>
        <Card className="min-h-40">
          <CardContent className="flex flex-col flex-1 items-center justify-center gap-2">
            <span className="text-muted-foreground">
              Nenhuma conta cadastrada ainda.
            </span>

            <AddSpaceAccount space={space} />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <h2 className="font-bold">Transações recentes</h2>
        <Card className="min-h-40">
          <CardContent className="flex flex-col flex-1 items-center justify-center gap-2">
            <span className="text-muted-foreground">
              Nenhuma transação registrada ainda.
            </span>

            <AddSpaceAccount space={space} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
