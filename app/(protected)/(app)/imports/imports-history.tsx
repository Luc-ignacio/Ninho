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
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-md border">
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
  );
}
