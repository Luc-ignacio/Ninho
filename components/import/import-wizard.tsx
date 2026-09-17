"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import {
  commitImport,
  previewImport,
  type CommitImportRow,
  type PreviewImportResult,
} from "@/app/actions/import";
import type { CurrencyType } from "@/app/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ImportDropZone } from "@/components/import/import-drop-zone";
import ImportReviewTable, {
  type ReviewRow,
} from "@/components/import/import-review-table";
import ImportTargetPicker, {
  type TargetKind,
} from "@/components/import/import-target-picker";
import type { RowCategory } from "@/components/import/select-row-category";
import type { ActiveSpace } from "@/lib/space/get-active-space";
import { formatCurrency, formatYmd } from "@/lib/utils";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const MAX_FILE_BYTES = 6 * 1024 * 1024;

function toReviewRows(preview: PreviewImportResult): ReviewRow[] {
  return preview.rows.map((row) => ({
    ...row,
    newCategoryName: null,
    selected: row.duplicate === "none",
  }));
}

export default function ImportWizard({
  space,
}: {
  space: NonNullable<ActiveSpace>;
}) {
  const router = useRouter();

  const [file, setFile] = React.useState<File | null>(null);
  const [kind, setKind] = React.useState<TargetKind>("account");
  const [accountId, setAccountId] = React.useState<string | null>(null);
  const [creditCardId, setCreditCardId] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<PreviewImportResult | null>(
    null,
  );
  const [rows, setRows] = React.useState<ReviewRow[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const targetId = kind === "account" ? accountId : creditCardId;

  const currency: CurrencyType = React.useMemo(() => {
    if (kind === "account") {
      return (
        space.Accounts.find((account) => account.id === accountId)?.currency ??
        "BRL"
      );
    }

    const card = space.CreditCards.find((item) => item.id === creditCardId);

    return card?.Account?.currency ?? "BRL";
  }, [kind, accountId, creditCardId, space]);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setRows([]);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file || !targetId) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (file.size > MAX_FILE_BYTES) {
        throw new Error("Arquivo muito grande. Envie um arquivo de até 6 MB.");
      }

      const bytes = new Uint8Array(await file.arrayBuffer());

      const result = await previewImport({
        fileName: file.name,
        bytes,
        accountId: kind === "account" ? accountId : null,
        creditCardId: kind === "card" ? creditCardId : null,
      });

      if (result.rows.length === 0) {
        throw new Error("Nenhuma transação encontrada no arquivo");
      }

      setPreview(result);
      setRows(toReviewRows(result));
    } catch (error: unknown) {
      setPreview(null);
      setRows([]);
      setError(error instanceof Error ? error.message : "Algo deu errado");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!preview) return;

    const selected = rows.filter((row) => row.selected);

    if (selected.length === 0) {
      setError("Selecione ao menos uma transação");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload: CommitImportRow[] = selected.map((row) => ({
        ymd: row.ymd,
        description: row.description,
        amountCents: row.amountCents,
        type: row.type,
        method: row.method,
        categoryId: row.categoryId,
        newCategoryName: row.newCategoryName,
        installmentNumber: row.installmentNumber,
        installmentTotal: row.installmentTotal,
        hashId: row.hashId,
      }));

      const result = await commitImport({
        fileName: preview.fileName,
        type: preview.type,
        accountId: preview.accountId,
        creditCardId: preview.creditCardId,
        referenceMonthYmd: preview.referenceMonthYmd,
        ledgerBalanceCents: preview.ledgerBalanceCents,
        ledgerBalanceYmd: preview.ledgerBalanceYmd,
        rows: payload,
      });

      const imported =
        result.skipped > 0
          ? `Importação concluída: ${result.created} transações importadas, ${result.skipped} ignoradas por duplicidade.`
          : `Importação concluída: ${result.created} transações importadas.`;

      setSuccess(
        result.balanceYmd && result.balanceCents !== null
          ? `${imported} Saldo da conta ajustado para ${formatCurrency(result.balanceCents, currency)} em ${formatYmd(result.balanceYmd)}.`
          : imported,
      );

      reset();
      router.refresh();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Algo deu errado");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCount = rows.filter((row) => row.selected).length;
  const inflowCents = rows
    .filter((row) => row.selected && row.type === "INCOME")
    .reduce((total, row) => total + row.amountCents, 0);
  const outflowCents = rows
    .filter((row) => row.selected && row.type === "EXPENSE")
    .reduce((total, row) => total + row.amountCents, 0);
  const duplicateCount = rows.filter((row) => row.duplicate !== "none").length;

  // O saldo da conta é sempre o registro mais recente: um extrato antigo entra
  // no histórico sem mexer nele.
  const staleAnchorYmd =
    preview?.accountBalanceYmd &&
    preview.ledgerBalanceYmd &&
    preview.accountBalanceYmd > preview.ledgerBalanceYmd
      ? preview.accountBalanceYmd
      : null;

  return (
    <div className="flex w-full flex-col gap-6">
      {success && <p className="text-sm text-lime-600">{success}</p>}

      {!preview && (
        <div className="flex w-full flex-col items-center gap-4">
          <ImportDropZone
            className="max-w-xl"
            file={file}
            disabled={isLoading}
            onFileSelected={setFile}
          />

          {file && (
            <div className="w-full max-w-xl">
              <ImportTargetPicker
                space={space}
                kind={kind}
                accountId={accountId}
                creditCardId={creditCardId}
                onKindChange={(next) => {
                  setKind(next);
                  setError(null);
                }}
                onAccountChange={setAccountId}
                onCreditCardChange={setCreditCardId}
              />

              <Button
                className="mt-4 w-full"
                disabled={!targetId || isLoading}
                onClick={handleAnalyze}
              >
                {isLoading ? (
                  <div className="animate-spin">
                    <HugeiconsIcon icon={Loading03Icon} />
                  </div>
                ) : (
                  "Analisar arquivo"
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {preview && (
        <div className="flex w-full flex-col gap-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {preview.fileName}
            </span>
            {preview.acctIdMasked && <span>•••• {preview.acctIdMasked}</span>}
            {preview.periodStartYmd && preview.periodEndYmd && (
              <span>
                {formatYmd(preview.periodStartYmd)} até{" "}
                {formatYmd(preview.periodEndYmd)}
              </span>
            )}
            {preview.skipped > 0 && (
              <span>{preview.skipped} linhas ignoradas</span>
            )}
          </div>

          {preview.currency && preview.currency !== currency && (
            <p className="text-sm text-amber-600">
              O arquivo está em {preview.currency}, mas o destino usa {currency}.
            </p>
          )}

          {staleAnchorYmd && (
            <p className="text-sm text-amber-600">
              O saldo da conta está registrado em {formatYmd(staleAnchorYmd)}, e
              esse registro é mais recente que este extrato: as transações
              entram no histórico, mas o saldo atual continua o mesmo.
            </p>
          )}

          {!staleAnchorYmd &&
            preview.ledgerBalanceYmd &&
            preview.ledgerBalanceCents !== null && (
              <p className="text-sm text-muted-foreground">
                Saldo do extrato em {formatYmd(preview.ledgerBalanceYmd)}:{" "}
                <span className="font-medium text-foreground">
                  {formatCurrency(preview.ledgerBalanceCents, currency)}
                </span>
                . Ele vira o saldo da conta, e os lançamentos posteriores a essa
                data seguem somando em cima dele.
              </p>
            )}

          {preview.type === "BANK_STATEMENT" &&
            preview.ledgerBalanceCents === null &&
            preview.accountBalanceYmd !== null && (
              <p className="text-sm text-amber-600">
                O arquivo não traz o saldo final da conta, então o saldo
                registrado em {formatYmd(preview.accountBalanceYmd)} continua
                valendo.
              </p>
            )}

          <Separator />

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="font-medium">
              {selectedCount} de {rows.length} selecionadas
            </span>
            <span className="text-lime-600">
              Entradas {formatCurrency(inflowCents, currency)}
            </span>
            <span className="text-red-600">
              Saídas {formatCurrency(outflowCents, currency)}
            </span>
            {duplicateCount > 0 && (
              <span className="text-muted-foreground">
                {duplicateCount} duplicatas
              </span>
            )}
          </div>

          <ImportReviewTable
            rows={rows}
            categories={space.Categories}
            suggestedNames={preview.suggestedCategoryNames}
            currency={currency}
            isCardStatement={preview.type === "CREDIT_CARD_STATEMENT"}
            onToggleRow={(key, selected) =>
              setRows((current) =>
                current.map((row) =>
                  row.key === key ? { ...row, selected } : row,
                ),
              )
            }
            onToggleAll={(selected) =>
              setRows((current) => current.map((row) => ({ ...row, selected })))
            }
            onCategoryChange={(key, next: RowCategory) =>
              setRows((current) =>
                current.map((row) =>
                  row.key === key
                    ? {
                        ...row,
                        categoryId: next.categoryId,
                        newCategoryName: next.newCategoryName,
                      }
                    : row,
                ),
              )
            }
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={reset} disabled={isLoading}>
              Cancelar
            </Button>

            <Button
              onClick={handleCommit}
              disabled={selectedCount === 0 || isLoading}
            >
              {isLoading ? (
                <div className="animate-spin">
                  <HugeiconsIcon icon={Loading03Icon} />
                </div>
              ) : (
                `Importar ${selectedCount} transações`
              )}
            </Button>
          </div>
        </div>
      )}

      {!preview && error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
