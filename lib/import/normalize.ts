const MAX_INSTALLMENTS = 48;

const NOISE_PHRASES = [
  "pagamento de boleto",
  "transferencia enviada",
  "transferencia recebida",
  "compra com cartao",
  "compra internacional",
  "compra c cartao",
  "compra nacional",
  "debito automatico",
  "pagto eletronico",
  "compra debito",
  "deb automatico",
  "pix transferencia",
  "pix recebido",
  "pix enviado",
  "pix qrcode",
  "transferencia",
  "recebimento",
  "liquidacao",
  "pagamento",
  "deb aut",
  "eireli",
  "pagto",
  "brasil",
  "ltda",
  "epp",
  "tev",
  "ted",
  "doc",
  "pix",
  "s a",
  "sa",
  "me",
  "br",
];

export interface InstallmentMatch {
  number: number;
  total: number;
  description: string;
}

function tidy(description: string) {
  return description
    .replace(/\s+/g, " ")
    .replace(/[\s\-–—•*]+$/, "")
    .trim();
}

function isValidInstallment(number: number, total: number) {
  return (
    Number.isInteger(number) &&
    Number.isInteger(total) &&
    total >= 2 &&
    total <= MAX_INSTALLMENTS &&
    number >= 1 &&
    number <= total
  );
}

export function extractInstallment(
  raw: string,
  isCardStatement: boolean,
): InstallmentMatch | null {
  const labelled = raw.match(
    /\bparc(?:ela)?\s*(\d{1,2})\s*(?:\/|\s+de\s+)\s*(\d{1,2})\b/i,
  );

  if (labelled) {
    const number = Number(labelled[1]);
    const total = Number(labelled[2]);

    if (isValidInstallment(number, total)) {
      return {
        number,
        total,
        description: tidy(raw.replace(labelled[0], " ")),
      };
    }
  }

  if (!isCardStatement) return null;

  const trailing = raw.match(/\s(\d{1,2})\s*\/\s*(\d{1,2})\s*$/);

  if (trailing) {
    const number = Number(trailing[1]);
    const total = Number(trailing[2]);

    if (isValidInstallment(number, total)) {
      return {
        number,
        total,
        description: tidy(raw.slice(0, trailing.index)),
      };
    }
  }

  return null;
}

const ACCOUNT_TAIL = /\s*ag[eê]ncia:\s*\S+\s*conta:\s*\S+\s*$/i;
const TRANSFER_PREFIX = /^(transfer[eê]ncia|pix|ted|doc)\b/i;

export function stripAccountTail(raw: string) {
  return raw.replace(ACCOUNT_TAIL, "").trim();
}

export function extractCounterparty(raw: string) {
  const text = stripAccountTail(raw);

  if (!TRANSFER_PREFIX.test(text)) return text;

  const segments = text.split(" - ").map((segment) => segment.trim());

  return segments.length >= 2 && segments[1] !== "" ? segments[1] : text;
}

export function normalizeForMethod(raw: string) {
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeDescription(raw: string) {
  const base = normalizeForMethod(raw);
  if (base === "") return raw.trim().toLowerCase();

  let text = ` ${base} `;

  for (const phrase of NOISE_PHRASES) {
    const needle = ` ${phrase} `;

    while (text.includes(needle)) {
      text = text.replace(needle, " ");
    }
  }

  const cleaned = text
    .split(" ")
    .filter(
      (token) =>
        token !== "" && !/^\d{4,}$/.test(token) && !/^x+\d+$/.test(token),
    )
    .join(" ")
    .replace(/\b\d{2} \d{2}( \d{2,4})?\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned === "" ? base : cleaned;
}

export function merchantKey(normalized: string) {
  const key = normalized.split(" ").slice(0, 3).join(" ").trim();

  return key.length < 4 ? null : key;
}
