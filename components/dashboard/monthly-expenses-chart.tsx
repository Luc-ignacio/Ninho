"use client";

import type { CurrencyType } from "@/app/generated/prisma/enums";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrency, formatYmd } from "@/lib/utils";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartConfig = {
  cents: {
    label: "Gastos",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export function MonthlyExpensesChart({
  data,
  currency,
}: {
  data: { date: string; cents: number }[];
  currency: CurrencyType;
}) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
      <BarChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
        <CartesianGrid vertical={false} />

        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={12}
          tickFormatter={(value: string) => value.slice(8, 10)}
        />

        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={76}
          tickFormatter={(value: number) => formatCurrency(value, currency)}
        />

        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) =>
                formatYmd(String(payload?.[0]?.payload?.date ?? ""))
              }
              formatter={(value) => (
                <div className="flex flex-1 items-center justify-between gap-4">
                  <span className="text-muted-foreground">Gastos</span>

                  <span className="font-mono font-medium tabular-nums">
                    {formatCurrency(Number(value), currency)}
                  </span>
                </div>
              )}
            />
          }
        />

        <Bar dataKey="cents" fill="var(--color-cents)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
