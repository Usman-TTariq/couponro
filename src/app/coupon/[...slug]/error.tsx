"use client";

import DataFetchError from "@/components/DataFetchError";

export default function CouponSlugError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <DataFetchError {...props} />;
}
