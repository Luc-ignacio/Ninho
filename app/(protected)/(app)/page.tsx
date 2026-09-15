import { ExpensesRankingChart } from "@/components/dashboard/expenses-ranking-chart";
import { MonthlyExpensesChart } from "@/components/dashboard/monthly-expenses-chart";
import { AddSpaceAccount } from "@/components/space/add-account";
import { AddSpaceCategory } from "@/components/space/add-category";
import { AddSpaceCreditCard } from "@/components/space/add-credit-card";
import { AddSpaceTransaction } from "@/components/space/add-transaction";
import { CreateSpace } from "@/components/space/create-space";
import { CreditCardItem } from "@/components/space/credit-card-item";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getActiveProfile } from "@/lib/auth/get-active-profile";
import { getActiveSpace } from "@/lib/space/get-active-space";
import {
  getSpaceDashboard,
  getSpaceTransactions,
  sumBalancesByCurrency,
} from "@/lib/space/queries";
import {
  accountTypeLabel,
  cn,
  currentMonthRangeUtc,
  formatCurrency,
  getGreeting,
} from "@/lib/utils";
import {
  BankIcon,
  CreditCardIcon,
  Tag01Icon,
  TradeDownIcon,
  TradeUpIcon,
  TransactionIcon,
  UserMultiple02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { columns } from "./transactions/columns";

export default async function DashboardPage() {
  const greeting = getGreeting();
  const profile = await getActiveProfile();
  const space = await getActiveSpace();

  if (!space) {
    redirect("/onboarding");
  }

  const month = currentMonthRangeUtc();

  const [dashboard, recent] = await Promise.all([
    getSpaceDashboard(
      space.id,
      month.start.toISOString().slice(0, 10),
      month.end.toISOString().slice(0, 10),
    ),
    getSpaceTransactions(space.id, null, null, 5, 0),
  ]);

  const balanceByCurrency = new Map(
    sumBalancesByCurrency(space.Accounts).map((balance) => [
      balance.currency,
      balance.balanceCents,
    ]),
  );

  const { currencies } = dashboard;
  const isMultiCurrency = currencies.length > 1;
  const expenseCurrencies = currencies.filter(
    (currency) => currency.expenseCents > 0,
  );

  const stats = [
    {
      id: "saldo-total",
      title: "Saldo Total",
      valueOf: (currency: (typeof currencies)[number]) =>
        balanceByCurrency.get(currency.currency) ?? 0,
      valueClass: () => "",
      footerIcon: null,
      footer:
        space.Accounts.length === 1
          ? "1 conta"
          : `${space.Accounts.length} contas`,
      footerClass: "text-muted-foreground",
    },
    {
      id: "receitas",
      title: "Receitas",
      valueOf: (currency: (typeof currencies)[number]) => currency.incomeCents,
      valueClass: () => "text-green-600",
      footerIcon: <HugeiconsIcon icon={TradeUpIcon} size={14} />,
      footer: "Entradas deste mês",
      footerClass: "text-green-600",
    },
    {
      id: "gastos",
      title: "Gastos",
      valueOf: (currency: (typeof currencies)[number]) => currency.expenseCents,
      valueClass: () => "text-red-600",
      footerIcon: <HugeiconsIcon icon={TradeDownIcon} size={14} />,
      footer: "Saídas deste mês",
      footerClass: "text-red-600",
    },
    {
      id: "saldo-do-mes",
      title: "Saldo Do Mês",
      valueOf: (currency: (typeof currencies)[number]) => currency.netCents,
      valueClass: (cents: number) =>
        cents < 0 ? "text-red-600" : "text-green-600",
      footerIcon: null,
      footer: "Receitas menos gastos",
      footerClass: "text-muted-foreground",
    },
  ];

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-6 rounded-2xl p-6 pb-12">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.id} size="sm">
            <CardContent className="flex flex-col gap-2">
              <span className="font-medium">{stat.title}</span>

              {currencies.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {currencies.map((currency) => {
                    const cents = stat.valueOf(currency);

                    return (
                      <div
                        key={currency.currency}
                        className="flex items-baseline gap-2"
                      >
                        <span
                          className={cn(
                            stat.valueClass(cents),
                            isMultiCurrency
                              ? "text-2xl font-bold"
                              : "text-3xl font-bold",
                          )}
                        >
                          {formatCurrency(cents, currency.currency)}
                        </span>

                        {isMultiCurrency && (
                          <span className="text-xs text-olive-600">
                            {currency.currency}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <span className="text-muted-foreground text-3xl font-bold">
                  {formatCurrency(0, "BRL")}
                </span>
              )}

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
        ))}
      </div>

      {expenseCurrencies.length > 0 ? (
        <Card>
          <CardContent className="flex flex-col gap-6">
            <span className="font-bold text-base">Gastos do mês</span>

            {expenseCurrencies.map((currency) => (
              <div key={currency.currency} className="flex flex-col gap-2">
                {isMultiCurrency && (
                  <span className="text-sm text-olive-600">
                    {currency.currency}
                  </span>
                )}

                <MonthlyExpensesChart
                  data={currency.dailyExpenses}
                  currency={currency.currency}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={TransactionIcon}
          title="Nenhum gasto neste mês"
          description="Lance uma despesa para acompanhar a evolução dos gastos do espaço."
          action={<AddSpaceTransaction space={space} />}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {expenseCurrencies.length > 0 ? (
          <Card>
            <CardContent className="flex flex-col gap-6">
              <span className="font-bold text-base">Gastos por categoria</span>

              {expenseCurrencies.map((currency) => (
                <div key={currency.currency} className="flex flex-col gap-2">
                  {isMultiCurrency && (
                    <span className="text-sm text-olive-600">
                      {currency.currency}
                    </span>
                  )}

                  <ExpensesRankingChart
                    data={currency.expensesByCategory}
                    currency={currency.currency}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            icon={Tag01Icon}
            title="Nenhum gasto por categoria"
            description="Crie categorias e classifique suas despesas para ver a divisão aqui."
            action={<AddSpaceCategory space={space} />}
          />
        )}

        {expenseCurrencies.length > 0 ? (
          <Card>
            <CardContent className="flex flex-col gap-6">
              <span className="font-bold text-base">Gastos por pessoa</span>

              {expenseCurrencies.map((currency) => (
                <div key={currency.currency} className="flex flex-col gap-2">
                  {isMultiCurrency && (
                    <span className="text-sm text-olive-600">
                      {currency.currency}
                    </span>
                  )}

                  <ExpensesRankingChart
                    data={currency.expensesByProfile}
                    currency={currency.currency}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            icon={UserMultiple02Icon}
            title="Nenhum gasto por pessoa"
            description="As despesas lançadas aparecem aqui divididas por responsável."
          />
        )}
      </div>

      <div className="space-y-6">
        <h2 className="font-bold">Contas</h2>

        {space.Accounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {space.Accounts.map((account) => (
              <Link href={`/accounts/${account.id}`} key={account.id}>
                <Item
                  variant="outline"
                  className="bg-white shadow-md cursor-pointer hover:border-olive-400 transition-all duration-200"
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

                      <div className="flex items-center gap-3 text-xs">
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

      <div className="space-y-6">
        <h2 className="font-bold">Cartões</h2>

        {space.CreditCards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {space.CreditCards.map((creditCard, index) => (
              <CreditCardItem
                key={creditCard.id}
                space={space}
                creditCard={creditCard}
                index={index}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={CreditCardIcon}
            title="Nenhum cartão ainda"
            description="Adicione um cartão para acompanhar faturas e parcelamentos."
            action={<AddSpaceCreditCard space={space} />}
          />
        )}
      </div>

      <div className="space-y-6">
        <h2 className="font-bold">Transações recentes</h2>

        {recent.transactions.length > 0 ? (
          <DataTable columns={columns} data={recent.transactions} />
        ) : (
          <EmptyState
            icon={TransactionIcon}
            title="Nenhuma transação ainda"
            description="Adicione sua primeira transação ou importe um extrato para começar."
            action={<AddSpaceTransaction space={space} />}
          />
        )}
      </div>
    </div>
  );
}
