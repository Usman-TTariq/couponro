"use client";

import { useState } from "react";
import Link from "next/link";
import type { Store } from "@/types/store";

type Props = {
  coupons: Store[];
  storeByName: Record<string, { logoUrl?: string }>;
};

function parseDiscount(text: string): string {
  const match = text.match(/(\d+%|\$\d+|\d+\s*%|%\s*off)/i);
  return match ? match[1].trim() : "";
}

function getCouponCode(c: Store): string {
  const code = c.couponCode ?? (c as Record<string, unknown>).coupon_code ?? "";
  return String(code).trim();
}

export default function CouponCodesSection({ coupons, storeByName }: Props) {
  const codeCoupons = coupons.filter((c) => {
    if (c.status === "disable") return false;
    return getCouponCode(c).length > 0;
  });

  return (
    <section
      id="coupon-codes"
      className="bg-[#eef6fa] py-10 md:py-12"
      aria-labelledby="coupon-codes-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2
          id="coupon-codes-heading"
          className="text-2xl font-bold text-[#37474f] mb-6"
        >
          Coupon Codes
        </h2>

        {codeCoupons.length === 0 ? (
          <p className="text-slate-600 text-sm py-4">No coupon codes at the moment. Check back soon or browse deals above.</p>
        ) : (
          <ul className="space-y-0 divide-y divide-slate-200 max-h-[70vh] overflow-y-auto overflow-x-hidden">
            {codeCoupons.slice(0, 20).map((coupon) => (
              <CouponCodeCard
                key={coupon.id}
                coupon={coupon}
                storeLogoUrl={storeByName[(coupon.name ?? "").trim()]?.logoUrl}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function CouponCodeCard({
  coupon,
  storeLogoUrl,
}: {
  coupon: Store;
  storeLogoUrl?: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const code = getCouponCode(coupon);
  const slug = coupon.slug || coupon.name?.toLowerCase().replace(/\s+/g, "-") || "";
  const title = coupon.couponTitle?.trim() || coupon.badgeLabel?.trim() || `${coupon.name} discount`;
  const description = coupon.description?.trim() || `Use this code at checkout for ${coupon.name}.`;
  const discountStr = parseDiscount(coupon.badgeLabel ?? coupon.couponTitle ?? "") || "CODE";
  const isVerified = coupon.verified !== false;

  const handleClick = () => {
    if (!revealed) {
      setRevealed(true);
    } else {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const codeDisplay = code.toUpperCase();

  return (
    <li className="bg-white">
      <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-5">
        {/* Left: logo + discount */}
        <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:w-28 flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-lobster text-white flex flex-col items-center justify-center overflow-hidden shrink-0 shadow-sm">
            <span className={`font-extrabold leading-none tracking-wide ${discountStr === "DEAL" ? "text-lg" : "text-sm"}`}>{discountStr}</span>
            {discountStr !== "DEAL" ? <span className="text-[9px] font-semibold uppercase mt-1 opacity-95">Coupon</span> : null}
          </div>
          <div>
            <p className="text-xl font-bold text-[#1e88e5] leading-tight">{discountStr}</p>
            <p className="text-xs text-slate-500 mt-0.5">OFF</p>
            <p className="text-xs text-slate-500">CODE</p>
          </div>
        </div>

        {/* Middle: title + description */}
        <div className="flex-1 min-w-0">
          {isVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200 mb-1">
              <span aria-hidden>✓</span> Verified
            </span>
          )}
          <h3 className="font-bold text-[#1e88e5] text-base sm:text-lg leading-snug">
            {coupon.name && `${coupon.name}: `}{title}
          </h3>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">{description}</p>
        </div>

        {/* Right: COUPON CODE button + dashed code box (2nd SS style), hover reveals last 2 chars */}
        <div className="flex flex-col items-start gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleClick}
              className="rounded bg-[#1e88e5] hover:bg-[#1565c0] text-white font-semibold text-xs uppercase tracking-wide px-4 py-2.5 whitespace-nowrap transition-colors"
            >
              {revealed ? (copied ? "Copied!" : "Copy Code") : "Coupon Code"}
            </button>
            <div
              className="w-fit min-w-[4ch] max-w-[10rem] h-10 px-1.5 flex items-center justify-center bg-white border-2 border-dashed border-slate-400 font-mono text-sm font-semibold text-slate-900 select-all uppercase"
              style={{ borderStyle: "dashed" }}
              role="textbox"
              aria-label="Coupon code"
            >
              {codeDisplay}
            </div>
          </div>
          <Link
            href={`/stores/${encodeURIComponent(slug)}`}
            className="text-sm text-[#1e88e5] hover:underline"
          >
            {coupon.name} Coupons
          </Link>
        </div>
      </div>
    </li>
  );
}

