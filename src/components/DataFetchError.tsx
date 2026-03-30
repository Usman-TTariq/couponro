"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DataFetchError({ error, reset }: Props) {
  return (
    <div className="min-h-screen bg-almond flex flex-col">
      <Header />
      <main className="flex-1 mx-auto max-w-7xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-space">Couldn&apos;t load this page</h1>
        <p className="mt-2 text-rebecca max-w-md mx-auto">
          The store list couldn&apos;t be loaded right now. This is usually temporary — try again in a
          moment.
        </p>
        {process.env.NODE_ENV === "development" && error?.message ? (
          <p className="mt-4 text-xs text-rebecca/70 font-mono break-all max-w-lg mx-auto">
            {error.message}
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-lg bg-lobster px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-lg border-2 border-rebecca bg-white px-4 py-2 text-sm font-medium text-rebecca hover:bg-almond"
          >
            Home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
