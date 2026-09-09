import { DeleteSpaceAccount } from "@/components/space/delete-account";
import { AddSpaceTransaction } from "@/components/space/add-transaction";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { getActiveSpace } from "@/lib/space/get-active-space";
import { getSpaceAccountById, getSpaceTransactions } from "@/lib/space/queries";
import { accountTypeLabel, formatCurrency } from "@/lib/utils";
import { ArrowLeft02Icon, TransactionIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { columns } from "../../transactions/columns";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const space = await getActiveSpace();

  if (!space) {
    notFound();
  }

  const account = await getSpaceAccountById(id, space.id);

  if (!account) {
    notFound();
  }

  const { transactions } = await getSpaceTransactions(
    space.id,
    account.id,
    null,
    10,
  );

  return (
    <div className="flex flex-col w-full rounded-2xl p-6 gap-6 pb-12">
      <div>
        <div className="flex w-full items-center justify-between">
          <Link href="/accounts">
            <Button variant="ghost" className="-ml-3.5">
              <HugeiconsIcon icon={ArrowLeft02Icon} />
              Contas
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <AddSpaceTransaction space={space} defaultAccountId={account.id} />
            <DeleteSpaceAccount account={account} />
            <SidebarTrigger size="icon-lg" />
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-xl font-medium">{account.name}</span>
          <span className="text-sm text-olive-600">
            {accountTypeLabel[account.type]} • {account.currency}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Item variant="outline" className="bg-white shadow-md">
            <ItemContent className="flex flex-col gap-4">
              <ItemDescription>Saldo atual</ItemDescription>
              <span className="text-2xl font-semibold">
                {formatCurrency(account.balanceCents, account.currency)}
              </span>
            </ItemContent>
          </Item>

          <Item variant="outline" className="bg-white shadow-md">
            <ItemContent className="flex flex-col gap-4">
              <div className="space-y-2">
                <ItemTitle className="text-base font-semibold">
                  Informações da conta
                </ItemTitle>

                <div className="flex items-center justify-between gap-4">
                  <ItemDescription>Instituição</ItemDescription>
                  <span className="font-semibold">{account.name}</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <ItemDescription>Tipo</ItemDescription>
                  <span className="font-semibold">
                    {accountTypeLabel[account.type]}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <ItemDescription>Moeda</ItemDescription>
                  <span className="font-semibold">{account.currency}</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <ItemDescription>Titular</ItemDescription>
                  <span className="font-semibold">{account.Profile?.name}</span>
                </div>
              </div>
            </ItemContent>
          </Item>
        </div>

        <div className="space-y-6">
          <h2 className="font-bold">Transações recentes</h2>

          {transactions.length > 0 ? (
            <DataTable columns={columns} data={transactions} />
          ) : (
            <Card className="min-h-40">
              <CardContent className="flex flex-col flex-1 items-center justify-center space-y-4">
                <div className="p-4 bg-accent rounded-xl">
                  <HugeiconsIcon icon={TransactionIcon} />
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-bold text-base">
                    Nenhuma transação ainda
                  </span>

                  <span className="text-muted-foreground">
                    Adicione sua primeira transação ou importe um extrato para
                    começar.
                  </span>
                </div>

                <AddSpaceTransaction
                  space={space}
                  defaultAccountId={account.id}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
