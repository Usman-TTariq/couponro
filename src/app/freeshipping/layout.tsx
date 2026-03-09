import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Shipping Offers",
  description:
    "Get free shipping and cashback at thousands of stores. Find the best free shipping deals and save on delivery at Couponro.",
};

export default function FreeShippingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
