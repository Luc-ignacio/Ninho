import { AddSpaceAccount } from "@/components/space/add-account";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { PageHeader } from "@/components/ui/page-header";
import { getActiveSpace } from "@/lib/space/get-active-space";
import { accountTypeLabel, formatCurrency } from "@/lib/utils";
import {
  BankIcon,
  TradeDownIcon,
  TradeUpIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AccountsPage() {
  const space = await getActiveSpace();

  if (!space) {
    notFound();
  }

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-6 rounded-2xl p-4 pb-12 sm:p-6 sm:pb-12">
      <PageHeader
        title="Contas"
        description="Acompanhe os saldos das suas contas."
        actions={
          <AddSpaceAccount space={space} className="flex-1 sm:flex-none" />
        }
      />

      {space.Accounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {space.Accounts.map((account) => (
            <Link href={`/accounts/${account.id}`} key={account.id}>
              <Item
                variant="outline"
                className="bg-white shadow-md cursor-pointer hover:border-olive-400 transition-all duration-200"
                key={account.id}
              >
                <ItemContent className="flex flex-col gap-4">
                  <div>
                    <ItemTitle className="text-base font-semibold">
                      {account.name}
                    </ItemTitle>
                    <ItemDescription>
                      {accountTypeLabel[account.type]} • {account.currency}
                    </ItemDescription>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-lg font-semibold">
                      {formatCurrency(account.balanceCents, account.currency)}
                    </span>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <span className="text-olive-600">Este mês</span>

                      <span className="flex items-center gap-1 text-green-600">
                        <HugeiconsIcon icon={TradeUpIcon} size={14} />
                        {formatCurrency(
                          account.monthInflowCents,
                          account.currency,
                        )}
                      </span>

                      <span className="flex items-center gap-1 text-red-600">
                        <HugeiconsIcon icon={TradeDownIcon} size={14} />
                        {formatCurrency(
                          account.monthOutflowCents,
                          account.currency,
                        )}
                      </span>
                    </div>
                  </div>
                </ItemContent>

                <ItemActions className="h-full pt-2 items-start">
                  <Badge variant="secondary" className="text-olive-600">
                    {account.Profile?.name}
                  </Badge>
                </ItemActions>
              </Item>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BankIcon}
          title="Nenhuma conta ainda"
          description="Adicione sua primeira conta para começar a acompanhar suas finanças."
          action={<AddSpaceAccount space={space} />}
        />
      )}
    </div>
  );
}
