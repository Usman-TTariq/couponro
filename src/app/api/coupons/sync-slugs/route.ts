import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { syncCouponSlugsFromStores } from "@/lib/stores";

export async function POST() {
  try {
    const { updated } = await syncCouponSlugsFromStores();
    revalidateTag("coupons");
    return NextResponse.json({ ok: true, updated });
  } catch (e) {
    console.error("[api/coupons/sync-slugs] POST:", e);
    const msg = e instanceof Error ? e.message : "Failed to sync coupon slugs";
    const isConfig = /supabase|not configured|env\.local/i.test(msg);
    return NextResponse.json(
      {
        error: isConfig
          ? "Supabase not configured. Add COUPONS env (or main Supabase) to run sync."
          : msg,
      },
      { status: isConfig ? 503 : 500 }
    );
  }
}
