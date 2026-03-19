import type { Metadata } from "next";
import HomePageClient from "@/components/HomePageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Coupon Codes, Deals & Free Shipping",
  description:
    "Couponro helps you save with verified coupon codes, promo codes, and free shipping offers from top stores. Find the best deals in one place.",
};

export default function HomePage() {
  return <HomePageClient />;
}
