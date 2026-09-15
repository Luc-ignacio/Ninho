import type {
  ImportType,
  TransactionMethod,
  TransactionType,
} from "@/app/generated/prisma/enums";

import { merchantKey, normalizeDescription } from "@/lib/import/normalize";
import type { StatementDirection } from "@/lib/import/types";

export const MERCHANT_RULES: Record<string, string[]> = {
  Renda: [
    "salario",
    "folha de pagamento",
    "pro labore",
    "prolabore",
    "13 salario",
    "ferias",
    "rendimento",
    "rendimentos",
    "juros sobre capital",
    "dividendos",
    "restituicao",
    "reembolso",
    "resgate",
    "cashback",
    "aposentadoria",
    "inss",
    "previdencia",
    "honorarios",
    "freelance",
    "comissao",
  ],
  Moradia: [
    "aluguel",
    "condominio",
    "imobiliaria",
    "iptu",
    "enel",
    "cemig",
    "cpfl",
    "coelba",
    "celpe",
    "copel",
    "equatorial",
    "neoenergia",
    "eletropaulo",
    "energisa",
    "energia eletrica",
    "sabesp",
    "copasa",
    "cedae",
    "sanepar",
    "caesb",
    "embasa",
    "comgas",
    "ultragaz",
    "liquigas",
    "gas natural",
    "vivo",
    "claro",
    "tim",
    "sky",
    "telefonica",
    "internet",
    "fibra",
    "algar",
    "seguro residencial",
    "leroy merlin",
    "telhanorte",
    "obramax",
    "cassol",
    "sodimac",
  ],
  Mercado: [
    "carrefour",
    "pao de acucar",
    "extra",
    "assai",
    "atacadao",
    "sams club",
    "makro",
    "tenda atacado",
    "bompreco",
    "supermercado",
    "supermercados",
    "mercado",
    "mercadinho",
    "mercearia",
    "hortifruti",
    "natural da terra",
    "oba hortifruti",
    "sacolao",
    "quitanda",
    "zona sul",
    "prezunic",
    "guanabara",
    "sonda",
    "st marche",
    "mambo",
    "verdemar",
    "super nosso",
    "angeloni",
    "zaffari",
    "condor",
    "muffato",
    "savegnago",
    "acougue",
  ],
  Restaurantes: [
    "ifood",
    "ifd",
    "rappi",
    "uber eats",
    "ubereats",
    "delivery much",
    "aiqfome",
    "james delivery",
    "zedelivery",
    "restaurante",
    "lanchonete",
    "padaria",
    "pizzaria",
    "hamburgueria",
    "burger king",
    "mc donalds",
    "mcdonalds",
    "bobs",
    "subway",
    "outback",
    "madero",
    "giraffas",
    "habibs",
    "spoleto",
    "china in box",
    "starbucks",
    "cafeteria",
    "cafe",
    "bar",
    "boteco",
    "churrascaria",
    "sushi",
    "temakeria",
    "acai",
    "sorveteria",
    "doceria",
    "confeitaria",
    "cacau show",
    "kopenhagen",
    "cantina",
  ],
  Transporte: [
    "uber",
    "99app",
    "99 tecnologia",
    "99pop",
    "cabify",
    "indriver",
    "taxi",
    "posto",
    "ipiranga",
    "shell",
    "br mania",
    "petrobras",
    "combustivel",
    "gasolina",
    "etanol",
    "estacionamento",
    "estapar",
    "multipark",
    "zona azul",
    "pedagio",
    "sem parar",
    "conectcar",
    "veloe",
    "autopass",
    "bilhete unico",
    "riocard",
    "metro",
    "cptm",
    "sptrans",
    "viacao",
    "rodoviaria",
    "latam",
    "gol linhas",
    "azul linhas",
    "localiza",
    "movida",
    "unidas",
    "seguro auto",
    "detran",
    "ipva",
    "licenciamento",
    "oficina",
    "autocenter",
    "dpaschoal",
    "pneu",
  ],
  Compras: [
    "amazon",
    "mercado livre",
    "mercadolivre",
    "shopee",
    "aliexpress",
    "shein",
    "temu",
    "magazine luiza",
    "magalu",
    "americanas",
    "submarino",
    "shoptime",
    "casas bahia",
    "ponto frio",
    "fast shop",
    "kabum",
    "pichau",
    "terabyte",
    "renner",
    "riachuelo",
    "zara",
    "hering",
    "centauro",
    "netshoes",
    "nike",
    "adidas",
    "decathlon",
    "marisa",
    "havaianas",
    "boticario",
    "natura",
    "avon",
    "sephora",
    "epoca cosmeticos",
    "tok stok",
    "mobly",
    "madeiramadeira",
    "westwing",
    "casa e video",
    "shopping",
    "loja",
  ],
  Lazer: [
    "netflix",
    "spotify",
    "disney",
    "disneyplus",
    "hbo",
    "prime video",
    "primevideo",
    "globoplay",
    "deezer",
    "youtube premium",
    "youtubepremium",
    "apple com bill",
    "apple services",
    "itunes",
    "google play",
    "playstation",
    "xbox",
    "steam",
    "nintendo",
    "epic games",
    "riot games",
    "twitch",
    "crunchyroll",
    "paramount",
    "telecine",
    "cinemark",
    "cinepolis",
    "uci cinemas",
    "kinoplex",
    "ingresso com",
    "ticketmaster",
    "sympla",
    "eventim",
    "teatro",
    "booking",
    "airbnb",
    "decolar",
    "hotel",
    "pousada",
    "cvc",
    "123milhas",
    "hurb",
    "parque",
  ],
  Educação: [
    "faculdade",
    "universidade",
    "unip",
    "uninter",
    "estacio",
    "anhanguera",
    "unopar",
    "fgv",
    "puc",
    "usp",
    "senai",
    "senac",
    "escola",
    "colegio",
    "creche",
    "mensalidade",
    "curso",
    "udemy",
    "alura",
    "coursera",
    "rocketseat",
    "duolingo",
    "babbel",
    "cambly",
    "wizard",
    "ccaa",
    "fisk",
    "kumon",
    "livraria",
    "saraiva",
    "kindle",
  ],
  Saúde: [
    "unimed",
    "amil",
    "bradesco saude",
    "sulamerica",
    "hapvida",
    "notredame",
    "notre dame",
    "porto saude",
    "golden cross",
    "prevent senior",
    "farmacia",
    "drogaria",
    "drogarias",
    "drogasil",
    "droga raia",
    "raia",
    "pacheco",
    "pague menos",
    "panvel",
    "nissei",
    "extrafarma",
    "ultrafarma",
    "venancio",
    "clinica",
    "hospital",
    "laboratorio",
    "fleury",
    "dasa",
    "delboni",
    "sabin",
    "hermes pardini",
    "einstein",
    "sirio libanes",
    "dentista",
    "odonto",
    "odontoprev",
    "psicolog",
    "terapia",
    "academia",
    "smartfit",
    "smart fit",
    "bluefit",
    "bodytech",
    "selfit",
    "panobianco",
    "gympass",
    "totalpass",
    "wellhub",
    "pilates",
    "crossfit",
  ],
  Outros: [
    "tarifa",
    "cesta de servicos",
    "anuidade",
    "iof",
    "juros",
    "encargos",
    "multa",
    "taxa",
    "seguro",
  ],
};

const FLAT_RULES = (() => {
  const seen = new Map<string, string>();
  const flat: { pattern: string; category: string }[] = [];

  for (const [category, patterns] of Object.entries(MERCHANT_RULES)) {
    for (const pattern of patterns) {
      const owner = seen.get(pattern);

      if (owner && owner !== category) {
        throw new Error(
          `Padrão "${pattern}" aparece em "${owner}" e "${category}"`,
        );
      }

      seen.set(pattern, category);
      flat.push({ pattern, category });
    }
  }

  return flat.sort((a, b) => b.pattern.length - a.pattern.length);
})();

export function matchRule(normalized: string) {
  const haystack = ` ${normalized} `;

  for (const { pattern, category } of FLAT_RULES) {
    if (haystack.includes(` ${pattern} `)) return category;
  }

  return null;
}

export interface HistoryEntry {
  description: string;
  categoryId: string;
  ymd: string;
}

export interface HistoryIndex {
  exact: Map<string, string>;
  merchant: Map<string, string>;
}

type Tally = Map<string, Map<string, { count: number; lastYmd: string }>>;

function record(tally: Tally, key: string, categoryId: string, ymd: string) {
  let bucket = tally.get(key);

  if (!bucket) {
    bucket = new Map();
    tally.set(key, bucket);
  }

  const current = bucket.get(categoryId);

  if (!current) {
    bucket.set(categoryId, { count: 1, lastYmd: ymd });
    return;
  }

  current.count += 1;
  if (ymd > current.lastYmd) current.lastYmd = ymd;
}

function elect(tally: Tally) {
  const winners = new Map<string, string>();

  for (const [key, bucket] of tally) {
    let best: { categoryId: string; count: number; lastYmd: string } | null =
      null;

    for (const [categoryId, stats] of bucket) {
      if (
        !best ||
        stats.count > best.count ||
        (stats.count === best.count && stats.lastYmd > best.lastYmd)
      ) {
        best = { categoryId, ...stats };
      }
    }

    if (best) winners.set(key, best.categoryId);
  }

  return winners;
}

export function buildHistoryIndex(entries: HistoryEntry[]): HistoryIndex {
  const exact: Tally = new Map();
  const merchant: Tally = new Map();

  for (const entry of entries) {
    const normalized = normalizeDescription(entry.description);
    if (normalized === "") continue;

    record(exact, normalized, entry.categoryId, entry.ymd);

    const key = merchantKey(normalized);
    if (key) record(merchant, key, entry.categoryId, entry.ymd);
  }

  return { exact: elect(exact), merchant: elect(merchant) };
}

export type CategorySource = "history" | "rule" | "none";

export interface CategorySuggestion {
  categoryId: string | null;
  suggestedCategoryName: string | null;
  source: CategorySource;
}

export function suggestCategory(
  normalized: string,
  index: HistoryIndex,
  categoryIdByName: Map<string, string>,
): CategorySuggestion {
  const exact = index.exact.get(normalized);

  if (exact) {
    return { categoryId: exact, suggestedCategoryName: null, source: "history" };
  }

  const key = merchantKey(normalized);
  const byMerchant = key ? index.merchant.get(key) : undefined;

  if (byMerchant) {
    return {
      categoryId: byMerchant,
      suggestedCategoryName: null,
      source: "history",
    };
  }

  const ruleName = matchRule(normalized);

  if (ruleName) {
    const categoryId = categoryIdByName.get(normalizeDescription(ruleName));

    return {
      categoryId: categoryId ?? null,
      suggestedCategoryName: categoryId ? null : ruleName,
      source: "rule",
    };
  }

  return { categoryId: null, suggestedCategoryName: null, source: "none" };
}

const INVOICE_PAYMENT =
  /\b(pagamento|pagto|pag)\b.*\b(fatura|cartao|cartão)\b|\bfatura\b.*\bcart(a|ã)o\b/i;

export function isInvoicePayment(text: string) {
  return INVOICE_PAYMENT.test(text);
}

export function inferType(
  statementType: ImportType,
  direction: StatementDirection,
  methodText: string,
): TransactionType {
  if (statementType === "CREDIT_CARD_STATEMENT") {
    return direction === "OUT" ? "EXPENSE" : "CREDIT_CARD_PAYMENT";
  }

  if (direction === "OUT" && isInvoicePayment(methodText)) {
    return "CREDIT_CARD_PAYMENT";
  }

  return direction === "OUT" ? "EXPENSE" : "INCOME";
}

export function inferMethod(
  statementType: ImportType,
  type: TransactionType,
  trntype: string,
  methodText: string,
): TransactionMethod {
  if (statementType === "CREDIT_CARD_STATEMENT") {
    return type === "EXPENSE" ? "CREDIT_CARD" : "BANK_TRANSFER";
  }

  if (type === "CREDIT_CARD_PAYMENT") return "BANK_TRANSFER";

  const has = (needle: string) => ` ${methodText} `.includes(` ${needle} `);

  if (has("pix")) return "PIX";

  if (trntype === "XFER" || has("ted") || has("doc") || has("transferencia")) {
    return "BANK_TRANSFER";
  }

  if (
    has("boleto") ||
    has("titulo") ||
    has("cobranca") ||
    has("darf") ||
    has("gps") ||
    has("das") ||
    has("fatura")
  ) {
    return "BOLETO";
  }

  if (trntype === "POS" || (has("compra") && (has("debito") || has("cartao")))) {
    return "DEBIT_CARD";
  }

  if (trntype === "ATM" || trntype === "CASH" || has("saque")) return "CASH";

  if (trntype === "DEP" || trntype === "DIRECTDEP" || trntype === "CREDIT") {
    return "BANK_TRANSFER";
  }

  return "OTHER";
}
