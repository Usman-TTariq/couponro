import type { Store } from "@/types/store";

const REPLACEMENT = "\uFFFD";

/** Fix mojibake and U+FFFD where currency symbols were corrupted. */
export function repairDisplayText(text: string | undefined | null): string {
  if (text == null) return "";
  let s = String(text);
  if (!s) return s;

  const pairs: [string, string][] = [
    ["Â£", "£"],
    ["â‚¬", "€"],
    ["â€™", "'"],
    ["â€œ", '"'],
    ["â€\u009d", '"'],
    ["Ã©", "é"],
    ["Ã¼", "ü"],
    ["Ã¶", "ö"],
    ["Ã¤", "ä"],
  ];
  for (const [from, to] of pairs) {
    if (s.includes(from)) s = s.split(from).join(to);
  }

  s = s.replace(/&pound;/gi, "£");
  s = s.replace(/&#163;/gi, "£");
  s = s.replace(/&euro;/gi, "€");
  s = s.replace(/&#8364;/gi, "€");

  // "Over 50" / "Over 50" → likely "Over £50" (UK coupons)
  s = s.replace(
    new RegExp(`${REPLACEMENT}\\s*(\\d)`, "g"),
    "£$1"
  );
  s = s.replace(
    new RegExp(`\\s${REPLACEMENT}\\s*(\\d)`, "g"),
    " £$1"
  );
  // Remaining replacement characters (unrecoverable) — remove
  s = s.replace(new RegExp(REPLACEMENT, "g"), "");

  return s;
}

const COUPON_TEXT_KEYS: (keyof Store)[] = [
  "name",
  "description",
  "couponTitle",
  "couponCode",
  "badgeLabel",
  "showCodeButtonText",
  "expiry",
];

export function repairCouponTextFields(coupon: Store): Store {
  const next = { ...coupon };
  for (const key of COUPON_TEXT_KEYS) {
    const v = next[key];
    if (typeof v === "string" && v) {
      (next as Record<string, unknown>)[key] = repairDisplayText(v);
    }
  }
  return next;
}

/** Read CSV/text uploads: UTF-8 first, fall back to Windows-1252 if needed. */
export async function readTextFileWithEncoding(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const slice =
    bytes.length >= 3 &&
    bytes[0] === 0xef &&
    bytes[1] === 0xbb &&
    bytes[2] === 0xbf
      ? bytes.slice(3)
      : bytes;

  const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(slice);
  const utf8Bad = (utf8.match(/\uFFFD/g) || []).length;

  if (utf8Bad === 0 && !utf8.includes("Â£")) return utf8;

  const win = new TextDecoder("windows-1252").decode(slice);
  const winBad = (win.match(/\uFFFD/g) || []).length;
  if (winBad < utf8Bad || (utf8.includes("Â") && !win.includes("Â£"))) {
    return win;
  }
  return utf8;
}
