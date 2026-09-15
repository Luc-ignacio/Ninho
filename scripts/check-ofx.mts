import { readFileSync } from "node:fs";

import {
  buildHistoryIndex,
  inferMethod,
  inferType,
  suggestCategory,
} from "@/lib/import/categorize";
import { buildHashId } from "@/lib/import/dedupe";
import { detectCharset } from "@/lib/import/decode";
import {
  extractCounterparty,
  extractInstallment,
  normalizeDescription,
  normalizeForMethod,
} from "@/lib/import/normalize";
import { parseOfx } from "@/lib/import/ofx";

const TEMPLATE_CATEGORIES = [
  "Renda",
  "Moradia",
  "Mercado",
  "Restaurantes",
  "Transporte",
  "Compras",
  "Lazer",
  "Educação",
  "Saúde",
  "Outros",
];

const paths = process.argv.slice(2);

if (paths.length === 0) {
  console.error("uso: npx tsx scripts/check-ofx.mts <arquivo.ofx> [outro.ofx]");
  process.exit(1);
}

const categoryIdByName = new Map(
  TEMPLATE_CATEGORIES.map((name) => [normalizeDescription(name), name]),
);

const history = buildHistoryIndex([]);
const hashesByFile: Record<string, string[]> = {};

for (const path of paths) {
  const bytes = new Uint8Array(readFileSync(path));
  const statement = parseOfx(bytes);
  const isCard = statement.type === "CREDIT_CARD_STATEMENT";
  const scope = statement.acctId ?? path;

  console.log(`\n=== ${path} ===`);
  console.log(`charset detectado: ${detectCharset(bytes)}`);
  console.log(
    `tipo: ${statement.type} · conta: ${statement.acctId} · moeda: ${statement.currency}`,
  );
  console.log(
    `periodo: ${statement.periodStartYmd} → ${statement.periodEndYmd} · mes ref: ${statement.referenceMonthYmd}`,
  );
  console.log(
    `saldo do extrato: ${statement.ledgerBalanceCents} em ${statement.ledgerBalanceYmd}`,
  );
  console.log(
    `transacoes: ${statement.transactions.length} · descartadas: ${statement.skipped}`,
  );

  const rows = statement.transactions.map((transaction) => {
    const installment = extractInstallment(transaction.description, isCard);
    const description = installment?.description ?? transaction.description;
    const methodText = normalizeForMethod(transaction.rawDescription);
    const normalized = normalizeDescription(extractCounterparty(description));
    const type = inferType(statement.type, transaction.direction, methodText);
    const method = inferMethod(
      statement.type,
      type,
      transaction.trntype,
      methodText,
    );

    const suggestion =
      type === "CREDIT_CARD_PAYMENT"
        ? { categoryId: null, suggestedCategoryName: null, source: "none" }
        : suggestCategory(normalized, history, categoryIdByName);

    return {
      data: transaction.ymd,
      descricao: description,
      normalizada: normalized,
      valor: transaction.amountCents,
      tipo: type,
      metodo: method,
      categoria:
        suggestion.categoryId ??
        (suggestion.suggestedCategoryName
          ? `+ ${suggestion.suggestedCategoryName}`
          : "—"),
      origem: suggestion.source,
      parcela: installment ? `${installment.number}/${installment.total}` : "",
      hashId: buildHashId(
        scope,
        transaction.fitid,
        transaction.ymd,
        transaction.amountCents,
        normalized,
      ),
    };
  });

  console.table(rows);
  hashesByFile[path] = rows.map((row) => row.hashId);
}

if (paths.length === 2) {
  const [first, second] = paths;
  const same =
    JSON.stringify(hashesByFile[first]) === JSON.stringify(hashesByFile[second]);

  console.log(
    `\nhashIds identicos entre os dois arquivos: ${same ? "SIM" : "NAO"}`,
  );
}
