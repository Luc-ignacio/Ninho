import { addMonthsUtc } from "@/lib/utils";

// A parcela 1 posta na data da compra e as seguintes no fechamento de cada
// fatura, então a distância entre a 1ª e a 2ª não é de um mês. Por isso a data
// fica fora da identidade da compra: ela só estima `purchaseDate` a partir da
// menor parcela conhecida.
export function impliedPurchaseDate(date: Date, installmentNumber: number) {
  return addMonthsUtc(date, -(installmentNumber - 1));
}

export function installmentGroupKey(
  scopeId: string | null,
  description: string,
  installmentTotal: number,
) {
  return [scopeId ?? "", description.trim().toLowerCase(), installmentTotal].join(
    "|",
  );
}
