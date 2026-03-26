"use client";

import { useState } from "react";
import Link from "next/link";
import type { Store } from "@/types/store";

type Props = {
  coupon: Store;
  variant?: "featured" | "compact";
  storeLogoUrl?: string;
};

export default function CouponCard({ coupon, variant = "compact", storeLogoUrl }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const isCode = coupon.couponType === "code";
  const hasCode = Boolean(coupon.couponCode?.trim());
  const link = coupon.link?.trim();
  const logoUrl = storeLogoUrl || coupon.logoUrl || "";

  const handleAction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCode && hasCode) {
      if (revealed) {
        navigator.clipboard.writeText(coupon.couponCode ?? "");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        setRevealed(true);
      }
    } else if (link) {
      window.open(link, "_blank");
    }
  };

  const offerText =
    coupon.badgeLabel?.trim() ||
    coupon.couponTitle?.trim() ||
    (hasCode ? "Get Code" : "Get Deal");
  const slug = coupon.slug || coupon.name?.toLowerCase().replace(/\s+/g, "-") || "";
  const isVerified = coupon.verified !== false;

  if (variant === "featured") {
    return (
      <Link
        href={`/stores/${encodeURIComponent(slug)}`}
        className="group rounded-2xl border-0 bg-white p-6 shadow-md hover:shadow-lg transition-all flex flex-col items-center text-center min-h-[200px] justify-between"
      >
        {isVerified && (
          <span className="self-end inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
            <span aria-hidden>✓</span> Verified
          </span>
        )}
        <div className="w-20 h-20 rounded-xl bg-almond flex items-center justify-center overflow-hidden shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt={coupon.name} className="w-full h-full object-contain" />
          ) : (
            <span className="text-2xl font-bold text-rebecca">{coupon.name?.charAt(0) ?? "?"}</span>
          )}
        </div>
        <p className="text-sm font-medium text-rebecca mt-2">{coupon.name ?? "–"}</p>
        <p className="text-base font-bold text-space mt-0.5 line-clamp-2">{offerText}</p>
      </Link>
    );
  }

  return (
    <div className="rounded-2xl border-0 bg-white shadow-md hover:shadow-lg transition-all flex flex-col overflow-hidden min-h-[180px]">
      {isVerified && (
        <div className="px-3 pt-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
            <span aria-hidden>✓</span> Verified
          </span>
        </div>
      )}
      <Link
        href={`/stores/${encodeURIComponent(slug)}`}
        className="flex flex-col flex-1 p-4 items-center text-center"
      >
        <div className="w-14 h-14 rounded-lg bg-almond flex items-center justify-center overflow-hidden shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt={coupon.name} className="w-full h-full object-contain" />
          ) : (
            <span className="text-lg font-bold text-rebecca">{coupon.name?.charAt(0) ?? "?"}</span>
          )}
        </div>
        <p className="text-xs font-medium text-rebecca mt-2">{coupon.name ?? "–"}</p>
      </Link>
      <button
        type="button"
        onClick={handleAction}
        className="w-full rounded-b-2xl bg-soft-cyan py-3 px-4 text-sm font-semibold text-space hover:bg-soft-cyan/90 transition-colors"
      >
        {isCode && hasCode
          ? revealed
            ? (copied ? "Copied!" : coupon.couponCode)
            : offerText
          : offerText}
      </button>
      {revealed && hasCode && (
        <p className="sr-only" aria-live="polite">
          Code: {coupon.couponCode}
        </p>
      )}
    </div>
  );
}
