import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { deleteAllCoupons } from "@/lib/stores";

export async function POST() {
  try {
    await deleteAllCoupons();
    revalidateTag("coupons");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/coupons/delete-all] POST:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete all coupons" },
      { status: 500 }
    );
  }
}
