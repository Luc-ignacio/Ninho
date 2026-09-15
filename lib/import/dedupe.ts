import { createHash } from "node:crypto";

function digest(parts: (string | number)[], length: number) {
  return createHash("sha256")
    .update(parts.join("|"))
    .digest("hex")
    .slice(0, length);
}

export function buildHashId(
  scope: string,
  fitid: string | null,
  ymd: string,
  amountCents: number,
  normalized: string,
) {
  const content = digest([ymd, amountCents, normalized], 12);

  if (fitid) return `ofx:${fitid}:${content}`;

  return `gen:${digest([scope, ymd, amountCents, normalized], 32)}`;
}

export function buildFingerprint(
  ymd: string,
  amountCents: number,
  normalized: string,
) {
  return `${ymd}|${amountCents}|${normalized}`;
}
