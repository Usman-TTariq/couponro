import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-almond flex flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold text-space">404</h1>
      <p className="mt-2 text-rebecca">This page could not be found.</p>
      <p className="mt-1 text-sm text-rebecca/80">
        Use <strong>http://localhost:3000</strong> if the app runs there.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-lobster px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Go to Home
        </Link>
        <Link
          href="/admin"
          className="rounded-lg border-2 border-rebecca bg-white px-4 py-2 text-sm font-medium text-rebecca hover:bg-almond"
        >
          Admin
        </Link>
      </div>
    </div>
  );
}
