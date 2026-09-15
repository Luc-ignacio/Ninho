const HEADER_SAMPLE_BYTES = 1024;

function readDeclaredCharset(bytes: Uint8Array) {
  const sample = new TextDecoder("latin1").decode(
    bytes.subarray(0, HEADER_SAMPLE_BYTES),
  );

  const xml = sample.match(/<\?xml[^>]*encoding=["']([^"']+)["']/i);
  if (xml) return xml[1].trim().toLowerCase();

  const encoding = sample.match(/^\s*ENCODING:(.+)$/im);
  if (encoding && /utf-?8/i.test(encoding[1])) return "utf-8";

  const charset = sample.match(/^\s*CHARSET:(.+)$/im);
  if (charset) {
    const value = charset[1].trim().toLowerCase();
    if (value === "1252" || value === "windows-1252") return "windows-1252";
    if (value.includes("8859-1")) return "iso-8859-1";
    if (value.includes("utf")) return "utf-8";
  }

  return null;
}

function isValidUtf8(bytes: Uint8Array) {
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return true;
  } catch {
    return false;
  }
}

function hasHighBytes(bytes: Uint8Array) {
  for (const byte of bytes) {
    if (byte >= 0x80) return true;
  }

  return false;
}

export function detectCharset(bytes: Uint8Array) {
  const declared = readDeclaredCharset(bytes);

  if (declared === "utf-8") return "utf-8";

  if (hasHighBytes(bytes) && isValidUtf8(bytes)) return "utf-8";

  return declared ?? "windows-1252";
}

export function decodeStatementBytes(bytes: Uint8Array) {
  const charset = detectCharset(bytes);
  const text = new TextDecoder(charset).decode(bytes);

  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}
