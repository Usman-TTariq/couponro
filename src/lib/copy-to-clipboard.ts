/** Best-effort copy in the same user-gesture stack (e.g. button click). */
export function copyToClipboardIfNonEmpty(text: string): void {
  const t = String(text ?? "").trim();
  if (!t) return;
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) return;
  void navigator.clipboard.writeText(t).catch(() => {});
}
