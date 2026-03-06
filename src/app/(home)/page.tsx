import type { Metadata } from "next";
import HomeNirvanaContent from "@/components/HomeNirvanaContent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Coupon Codes, Deals & Free Shipping",
  description:
    "Couponro helps you save with verified coupon codes, promo codes, and free shipping offers from top stores. Find the best deals in one place.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <HomeNirvanaContent />
    </div>
  );
}
