"use client";

import { useState } from "react";

type Props = {
  code: string;
  buttonText?: string;
  /** Show a small "View Terms" hint below, like store cards. */
  showViewTermsHint?: boolean;
  /** Placeholder text shown instead of the real code. */
  hiddenText?: string;
};

export default function CopyCouponCode({ code, buttonText, showViewTermsHint, hiddenText }: Props) {
  const [copied, setCopied] = useState(false);
  const safeCode = String(code ?? "").trim();
  const hasCode = safeCode.length > 0;
  const hiddenLabel = (hiddenText ?? "CODE HIDDEN").trim() || "CODE HIDDEN";

  const handleCopy = async () => {
    if (!hasCode) return;
    try {
      await navigator.clipboard.writeText(safeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // noop: if clipboard blocked, user can still open store and paste manually
    }
  };

  return (
    <div className="flex flex-col items-start gap-2 w-full">
      <div className="relative rounded-none overflow-hidden border border-slate-300 shadow-sm w-full h-11">
        <div
          className="absolute inset-0 bg-white border-l-2 border-dashed border-slate-400 font-mono text-sm font-semibold text-black select-none rounded-none uppercase flex items-center justify-end pr-3"
          style={{ borderStyle: "dashed" }}
          aria-label="Coupon code hidden"
        >
          {hiddenLabel}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!hasCode}
          className="absolute left-0 top-0 bottom-0 z-10 w-[calc(100%-3ch)] rounded-none bg-rebecca text-white font-semibold text-xs uppercase tracking-wide px-3 transition-all duration-200 flex items-center justify-center hover:bg-rebecca/90 hover:-translate-x-3 hover:shadow-md disabled:opacity-50 disabled:pointer-events-none"
          title={buttonText || "Get Code"}
        >
          {copied ? "Copied!" : buttonText || "GET CODE"}
        </button>
      </div>
      {showViewTermsHint ? <span className="text-xs text-slate-500">View Terms</span> : null}
    </div>
  );
}

