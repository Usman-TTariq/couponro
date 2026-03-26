"use client";

import { useState, useEffect } from "react";
import type { Store } from "@/types/store";

function getCode(c: Store): string {
  const code = c.couponCode ?? (c as Record<string, unknown>).coupon_code ?? "";
  return String(code).trim();
}

function getCouponUrl(c: Store, fallbackUrl?: string): string {
  const u =
    c.trackingUrl?.trim() ||
    c.storeWebsiteUrl?.trim() ||
    c.link?.trim() ||
    fallbackUrl?.trim() ||
    "";
  return u || "#";
}

type Props = {
  coupon: Store | null;
  onClose: () => void;
  storeLogoUrl?: string;
  /** When coupon has no URL, use store's tracking link in new tab */
  fallbackUrl?: string;
  /** When true, render as full page in new tab (no overlay); Continue to Store uses same tab */
  standalone?: boolean;
};

export default function CouponPopup({ coupon, onClose, storeLogoUrl, fallbackUrl, standalone }: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!coupon || standalone) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = "";
    };
  }, [coupon, onClose, standalone]);

  if (!coupon) return null;

  const code = getCode(coupon);
  const hasCode = code.length > 0;
  const url = getCouponUrl(coupon, fallbackUrl);
  const title = coupon.couponTitle?.trim() || coupon.badgeLabel?.trim() || `${coupon.name ?? ""} offer`;
  const storeName = coupon.name?.trim() || "Store";
  const logoUrl = storeLogoUrl || coupon.logoUrl || "";
  const isExclusive = (coupon.badgeLabel ?? coupon.couponTitle ?? "").toLowerCase().includes("exclusive");
  const isVerified = coupon.verified !== false;
  const dateStr = coupon.expiry?.trim() || coupon.createdAt?.trim() || "";

  const handleCopy = () => {
    if (!hasCode) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContinueToStore = () => {
    if (url && url !== "#") {
      if (standalone) {
        window.location.href = url;
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    }
    if (!standalone) onClose();
  };

  const wrapperClass = standalone
    ? "min-h-screen flex items-center justify-center p-4 bg-slate-500"
    : "fixed inset-0 z-[100] flex items-center justify-center p-4";

  return (
    <div
      className={wrapperClass}
      role={standalone ? "main" : "dialog"}
      aria-modal={!standalone}
      aria-labelledby="coupon-popup-title"
    >
      {!standalone && (
        <div
          className="absolute inset-0 bg-black/65 backdrop-blur-sm"
          aria-hidden="true"
          onClick={onClose}
        />
      )}

      {/* Modal – off-white so bg doesn’t look pure white */}
      <div className="relative w-full max-w-md rounded-2xl bg-slate-50 shadow-xl overflow-hidden">
        {/* Close X */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-5 sm:p-6">
          {/* Top: Exclusive pill + date */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {isVerified && (
              <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                ✓ Verified
              </span>
            )}
            {isExclusive && (
              <span className="inline-flex items-center rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-medium text-white">
                Exclusive
              </span>
            )}
            {dateStr && (
              <span className="text-sm text-slate-500">{dateStr}</span>
            )}
          </div>

          {/* Title */}
          <h2 id="coupon-popup-title" className="text-xl font-bold text-slate-900 mb-4 pr-8">
            {title}
          </h2>

          {/* Brand: logo + name */}
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 mb-4">
            <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="" className="w-full h-full object-contain" />
              ) : (
                <span className="text-sm font-bold text-slate-500">{storeName.charAt(0)}</span>
              )}
            </div>
            <span className="font-medium text-slate-800">{storeName}</span>
          </div>

          {/* Coupon code box (dashed, click to copy) */}
          {hasCode && (
            <button
              type="button"
              onClick={handleCopy}
              className="w-full rounded-xl border-2 border-dashed border-amber-400 bg-amber-50/80 py-4 px-4 mb-4 text-center hover:bg-amber-100/80 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
            >
              <span className="block text-xl font-bold text-slate-900 font-mono tracking-wide">
                {code}
              </span>
              <span className="block text-sm text-slate-600 mt-1">
                {copied ? "Copied!" : "Click to copy"}
              </span>
            </button>
          )}

          {/* Buttons */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleContinueToStore}
              className="w-full rounded-xl bg-lobster hover:bg-lobster/90 text-white font-semibold py-3.5 px-4 transition-colors"
            >
              Continue to Store
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl border-2 border-slate-300 bg-white text-slate-600 font-medium py-3 px-4 hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
