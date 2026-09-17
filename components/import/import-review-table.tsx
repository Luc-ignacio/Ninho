"use client";

import type { CurrencyType } from "@/app/generated/prisma/enums";
import type { PreviewImportRow } from "@/app/actions/import";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SpaceCategory } from "@/lib/space/queries";
import { formatCurrency, formatYmd, transactionTypeLabel } from "@/lib/utils";
import SelectRowCategory, {
  type RowCategory,
} from "@/components/import/select-row-category";

export interface ReviewRow extends PreviewImportRow {
  selected: boolean;
  newCategoryName: string | null;
}

function StatusBadge({ row }: { row: ReviewRow }) {
  if (row.duplicate === "hash") {
    return <Badge variant="outline">Duplicada</Badge>;
  }

  if (row.duplicate === "fingerprint") {
    return <Badge variant="outline">Provável duplicata</Badge>;
  }

  if (row.categorySource === "history") {
    return <Badge variant="secondary">Histórico</Badge>;
  }

  if (row.categorySource === "rule") {
    return <Badge variant="secondary">Sugerida</Badge>;
  }

  return null;
}

export default function ImportReviewTable({
  rows,
  categories,
  suggestedNames,
  currency,
  isCardStatement,
  onToggleRow,
  onToggleAll,
  onCategoryChange,
}: {
  rows: ReviewRow[];
  categories: SpaceCategory[];
  suggestedNames: string[];
  currency: CurrencyType;
  isCardStatement: boolean;
  onToggleRow: (key: string, selected: boolean) => void;
  onToggleAll: (selected: boolean) => void;
  onCategoryChange: (key: string, next: RowCategory) => void;
}) {
  const selectedCount = rows.filter((row) => row.selected).length;
  const allSelected = selectedCount === rows.length && rows.length > 0;

  return (
    <>
      <div className="flex max-h-[60dvh] w-full min-w-0 flex-col gap-3 overflow-y-auto md:hidden">
        <label className="flex items-center gap-2 text-sm font-medium">
          <Checkbox
            checked={allSelected}
            indeterminate={selectedCount > 0 && !allSelected}
            onCheckedChange={(checked) => onToggleAll(Boolean(checked))}
          />
          Selecionar todas
        </label>

        {rows.map((row) => {
          const formatted = formatCurrency(row.amountCents, currency);
          const isPayment = row.type === "CREDIT_CARD_PAYMENT";
          const isInflow =
            row.type === "INCOME" || (isPayment && isCardStatement);

          return (
            <div
              key={row.key}
              className="flex flex-col gap-3 rounded-2xl border bg-white p-4"
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  className="mt-1 shrink-0"
                  checked={row.selected}
                  onCheckedChange={(checked) =>
                    onToggleRow(row.key, Boolean(checked))
                  }
                />

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="wrap-break-word font-medium">
                      {row.description}
                    </span>

                    {row.installmentTotal && (
                      <Badge variant="outline" className="text-olive-600">
                        {row.installmentNumber}/{row.installmentTotal}
                      </Badge>
                    )}
                  </div>

                  <span className="text-xs text-olive-600">
                    {formatYmd(row.ymd)} • {transactionTypeLabel[row.type]}
                  </span>
                </div>

                <span
                  className={
                    isInflow
                      ? "shrink-0 font-medium text-lime-600"
                      : "shrink-0 font-medium text-red-600"
                  }
                >
                  {isInflow ? "+" : "−"}
                  {formatted}
                </span>
              </div>

              <SelectRowCategory
                categories={categories}
                suggestedNames={suggestedNames}
                disabled={isPayment}
                value={{
                  categoryId: row.categoryId,
                  newCategoryName: row.newCategoryName,
                }}
                onValueChange={(next) => onCategoryChange(row.key, next)}
              />

              <StatusBadge row={row} />
            </div>
          );
        })}
      </div>

      <div className="hidden max-h-[60dvh] w-full min-w-0 max-w-full overflow-auto rounded-md border md:block">
        <Table className="bg-white" containerClassName="overflow-visible">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  indeterminate={selectedCount > 0 && !allSelected}
                  onCheckedChange={(checked) => onToggleAll(Boolean(checked))}
                />
              </TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((row) => {
              const formatted = formatCurrency(row.amountCents, currency);
              const isPayment = row.type === "CREDIT_CARD_PAYMENT";
              const isInflow =
                row.type === "INCOME" || (isPayment && isCardStatement);

              return (
                <TableRow key={row.key} data-state={row.selected ? "" : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={row.selected}
                      onCheckedChange={(checked) =>
                        onToggleRow(row.key, Boolean(checked))
                      }
                    />
                  </TableCell>

                  <TableCell className="whitespace-nowrap">
                    {formatYmd(row.ymd)}
                  </TableCell>

                  <TableCell>
                    <span
                      className="flex items-center gap-2"
                      title={row.rawDescription}
                    >
                      {row.description}
                      {row.installmentTotal && (
                        <Badge variant="outline" className="text-olive-600">
                          {row.installmentNumber}/{row.installmentTotal}
                        </Badge>
                      )}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Badge variant="secondary">
                      {transactionTypeLabel[row.type]}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <SelectRowCategory
                      categories={categories}
                      suggestedNames={suggestedNames}
                      disabled={isPayment}
                      value={{
                        categoryId: row.categoryId,
                        newCategoryName: row.newCategoryName,
                      }}
                      onValueChange={(next) => onCategoryChange(row.key, next)}
                    />
                  </TableCell>

                  <TableCell className="text-right whitespace-nowrap">
                    {isInflow ? (
                      <span className="font-medium text-lime-600">
                        +{formatted}
                      </span>
                    ) : (
                      <span className="font-medium text-red-600">
                        −{formatted}
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    <StatusBadge row={row} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
