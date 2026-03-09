import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog – Saving Tips & Guides",
  description:
    "Read Couponro's blog for saving tips, shopping guides, and the latest deals. Learn how to save more with coupons and promo codes.",
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
