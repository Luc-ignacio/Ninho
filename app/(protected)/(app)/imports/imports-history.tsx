import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SpaceImport } from "@/lib/space/queries";
import { formatYmd, importTypeLabel } from "@/lib/utils";

function targetLabel(item: SpaceImport) {
  if (item.CreditCard) {
    return item.CreditCard.lastFour
      ? `${item.CreditCard.name} •••• ${item.CreditCard.lastFour}`
      : item.CreditCard.name;
  }

  return item.Account?.name ?? "—";
}

export default function ImportsHistory({
  imports,
}: {
  imports: SpaceImport[];
}) {
  return (
    <>
      <div className="flex flex-col gap-3 md:hidden">
        {imports.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-2 rounded-2xl border bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="wrap-break-word font-medium">
                {item.fileName}
              </span>

              <Badge variant="secondary" className="shrink-0">
                {importTypeLabel[item.type]}
              </Badge>
            </div>

            <span className="wrap-break-word text-sm text-olive-600">
              {targetLabel(item)}
              {item.referenceMonthYmd
                ? ` • ${formatYmd(item.referenceMonthYmd).slice(3)}`
                : ""}
            </span>

            <span className="text-xs text-olive-600">
              {item.transactionCount}{" "}
              {item.transactionCount === 1 ? "transação" : "transações"} •{" "}
              {formatYmd(item.createdAtYmd)}
              {item.ImportedBy?.name ? ` • ${item.ImportedBy.name}` : ""}
            </span>
          </div>
        ))}
      </div>

      <div className="hidden w-full min-w-0 max-w-full overflow-hidden rounded-md border md:block">
        <Table className="bg-white">
          <TableHeader>
            <TableRow>
              <TableHead>Arquivo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Mês</TableHead>
              <TableHead>Transações</TableHead>
              <TableHead>Importado em</TableHead>
              <TableHead>Por</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {imports.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.fileName}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{importTypeLabel[item.type]}</Badge>
                </TableCell>
                <TableCell>{targetLabel(item)}</TableCell>
                <TableCell>
                  {item.referenceMonthYmd
                    ? formatYmd(item.referenceMonthYmd).slice(3)
                    : "—"}
                </TableCell>
                <TableCell>{item.transactionCount}</TableCell>
                <TableCell>{formatYmd(item.createdAtYmd)}</TableCell>
                <TableCell>{item.ImportedBy?.name ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
