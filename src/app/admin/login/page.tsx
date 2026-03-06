"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/admin";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Login failed.");
        return;
      }
      router.push(redirect);
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white font-bold text-lg mb-4">
            S
          </div>
          <Link href="/" className="text-xl font-bold text-slate-900 tracking-tight">
            Store Admin
          </Link>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to manage stores and coupons
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/50"
        >
          <h1 className="text-lg font-semibold text-slate-900 mb-6">
            Sign in
          </h1>
          {error && (
            <div className="mb-4 rounded-lg bg-red-100 border-2 border-red-400 px-4 py-3 text-sm font-medium text-red-800">
              {error}
            </div>
          )}
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            className="w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-500 focus:border-slate-500 focus:ring-2 focus:ring-slate-400/30 outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-lg bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            ← Back to site
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
