"use client";

import type { CurrencyType } from "@/app/generated/prisma/enums";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useIsMobile } from "@/hooks/use-mobile";
import type { DashboardSlice } from "@/lib/space/queries";
import { formatCurrency } from "@/lib/utils";
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";

const SLICE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const chartConfig = {
  cents: {
    label: "Gastos",
  },
} satisfies ChartConfig;

export function ExpensesRankingChart({
  data,
  currency,
}: {
  data: DashboardSlice[];
  currency: CurrencyType;
}) {
  const isMobile = useIsMobile();

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto w-full"
      style={{ height: data.length * 40 + 16 }}
    >
      <BarChart data={data} layout="vertical" margin={{ left: 4, right: 8 }}>
        <XAxis type="number" dataKey="cents" hide />

        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          width={isMobile ? 88 : 124}
          tickMargin={8}
          tickFormatter={(value: string) =>
            isMobile && value.length > 12 ? `${value.slice(0, 11)}…` : value
          }
        />

        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, _name, item) => (
                <div className="flex flex-1 items-center justify-between gap-4">
                  <span className="text-muted-foreground">
                    {String(item?.payload?.name ?? "")}
                  </span>

                  <span className="font-mono font-medium tabular-nums">
                    {formatCurrency(Number(value), currency)}
                  </span>
                </div>
              )}
            />
          }
        />

        <Bar dataKey="cents" radius={4}>
          {data.map((slice, index) => (
            <Cell
              key={slice.id ?? slice.name}
              fill={SLICE_COLORS[index % SLICE_COLORS.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
