"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type CouponOffer = {
  id: string;
  name?: string;
  slug?: string;
  couponTitle?: string;
  badgeLabel?: string;
  couponCode?: string;
  status?: string;
};

function getSlug(c: CouponOffer): string {
  return c.slug || c.name?.toLowerCase().replace(/\s+/g, "-") || c.id || "";
}

function getLabel(c: CouponOffer): string {
  const title = (c.couponTitle ?? c.badgeLabel ?? "").trim();
  const name = (c.name ?? "").trim();
  if (title && name) return `${title} at ${name}`;
  if (title) return title;
  if (name) return `Deals at ${name}`;
  return "Offer";
}

const ROTATE_SECONDS = 4;

export default function HeaderPromoStrip() {
  const [offers, setOffers] = useState<CouponOffer[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/coupons?page=1&limit=6&status=all&codes_first=1")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const list = data?.coupons ?? [];
        setOffers(Array.isArray(list) ? list.filter((c: CouponOffer) => (c.status ?? "enable") !== "disable") : []);
      })
      .catch(() => {
        if (!cancelled) setOffers([]);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (offers.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % offers.length);
    }, ROTATE_SECONDS * 1000);
    return () => clearInterval(id);
  }, [offers.length]);

  if (offers.length === 0) {
    return (
      <div className="bg-lobster px-4 py-1.5 text-center text-sm text-white">
        Get the best deals – browse coupons &amp; stores
      </div>
    );
  }

  const list = offers.slice(0, 6);
  const current = list[index % list.length];

  return (
    <div className="bg-lobster px-3 sm:px-4 py-2 sm:py-1.5 text-center text-white overflow-hidden">
      <Link
        href={`/stores/${encodeURIComponent(getSlug(current))}`}
        className="hover:underline font-medium text-xs sm:text-sm line-clamp-2 sm:line-clamp-none"
      >
        {getLabel(current)}
      </Link>
    </div>
  );
}
