"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Store } from "@/types/store";
import CouponPopup from "@/components/CouponPopup";

export default function CouponPopupPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const [coupon, setCoupon] = useState<Store | null>(null);
  const [storeLogoUrl, setStoreLogoUrl] = useState<string | undefined>();
  const [fallbackUrl, setFallbackUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [cRes, sRes] = await Promise.all([
          fetch(`/api/coupons/${encodeURIComponent(id)}`, { cache: "no-store" }),
          fetch("/api/stores", { cache: "no-store" }),
        ]);
        if (cancelled) return;
        if (!cRes.ok) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const c = await cRes.json();
        const stores: Store[] = await sRes.json().then((d) => (Array.isArray(d) ? d : []));
        const storeName = (c?.name ?? "").trim();
        const store = stores.find((s) => (s.name ?? "").trim() === storeName);
        setCoupon(c);
        setStoreLogoUrl(store?.logoUrl);
        setFallbackUrl(store?.trackingUrl?.trim() || store?.storeWebsiteUrl?.trim() || "");
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleClose = () => {
    router.push("/coupons");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-500">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-rebecca border-t-transparent" />
        <span className="ml-3 text-rebecca font-medium">Loading…</span>
      </div>
    );
  }

  if (notFound || !coupon) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-500 p-4">
        <p className="text-white mb-4">Coupon not found.</p>
        <button
          type="button"
          onClick={() => router.push("/coupons")}
          className="rounded-xl bg-lobster text-white font-semibold py-2.5 px-4 hover:bg-lobster/90"
        >
          Back to Coupons
        </button>
      </div>
    );
  }

  return (
    <CouponPopup
      coupon={coupon}
      onClose={handleClose}
      storeLogoUrl={storeLogoUrl}
      fallbackUrl={fallbackUrl || undefined}
      standalone
    />
  );
}
