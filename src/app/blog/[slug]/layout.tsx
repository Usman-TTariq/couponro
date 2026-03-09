import type { ReactNode } from "react";
import ThemeLoader from "@/components/ThemeLoader";

/** Theme CSS only for inner blog post pages (e.g. /blog/macys-coupon-codes-2026). */
export default function BlogPostLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ThemeLoader />
      {children}
    </>
  );
}
