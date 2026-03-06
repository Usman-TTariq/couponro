import { NextRequest, NextResponse } from "next/server";
import { getCouponById } from "@/lib/stores";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const coupon = await getCouponById(id ?? "");
    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }
    return NextResponse.json(coupon);
  } catch (e) {
    console.error("[api/coupons/[id]] GET:", e);
    return NextResponse.json(
      { error: "Failed to load coupon" },
      { status: 500 }
    );
  }
}
