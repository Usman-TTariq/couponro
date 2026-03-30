"use client";

import { useEffect, useRef, useState } from "react";
import type { Store } from "@/types/store";
import { slugify } from "@/lib/slugify";
import { parseCSV } from "@/lib/parse-csv";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

const UPLOAD_TIMEOUT_MS = 45000;
const LOAD_TIMEOUT_MS = 25000;

export default function AdminCouponsPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [coupons, setCoupons] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "enable" | "disable">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState<Partial<Store> & { id?: string; selectedStoreId?: string }>({
    couponType: "deal",
    priority: 0,
    active: true,
    verified: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingCoupons, setUploadingCoupons] = useState(false);
  const [uploadCouponsProgress, setUploadCouponsProgress] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [syncingSlugs, setSyncingSlugs] = useState(false);
  const [removingDuplicates, setRemovingDuplicates] = useState(false);
  const [selectedCouponIds, setSelectedCouponIds] = useState<Set<string>>(new Set());
  const [deletingSelected, setDeletingSelected] = useState(false);
  const uploadCouponsInputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([
        fetchWithTimeout("/api/stores", { cache: "no-store" }, LOAD_TIMEOUT_MS),
        fetchWithTimeout(
          `/api/coupons?page=${page}&limit=${limit}&status=${statusFilter}&q=${encodeURIComponent(searchQuery.trim())}&fresh=1`,
          { cache: "no-store" },
          LOAD_TIMEOUT_MS
        ),
      ]);
      const sData = await sRes.json().catch(() => []);
      const cData = await cRes.json().catch(() => ({}));
      setStores(Array.isArray(sData) ? sData : []);
      if (!cRes.ok) {
        const errMsg = typeof cData?.error === "string" ? cData.error : "Failed to load coupons.";
        setMessage({ type: "err", text: errMsg });
        setCoupons([]);
        setTotal(0);
      } else if (cData?.coupons && typeof cData?.total === "number") {
        setCoupons(Array.isArray(cData.coupons) ? cData.coupons : []);
        setTotal(cData.total);
      } else {
        setCoupons(Array.isArray(cData) ? cData : []);
        setTotal(Array.isArray(cData) ? cData.length : 0);
      }
    } catch (e) {
      const msg = e instanceof Error && e.name === "AbortError"
        ? "Request timed out. Supabase may be unreachable (e.g. Cloudflare 522). Check project not paused and .env."
        : "Failed to load data";
      setMessage({ type: "err", text: msg });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, statusFilter, searchQuery]);

  const showMsg = (type: "ok" | "err", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const resetForm = () => {
    setForm({
      couponType: "deal",
      priority: 0,
      active: true,
      verified: true,
      selectedStoreId: "",
    });
    setEditingId(null);
    setShowCreateForm(false);
  };

  const handleDeleteAll = async () => {
    if (!confirm("Delete ALL coupons? This cannot be undone.")) return;
    setDeletingAll(true);
    try {
      const res = await fetch("/api/coupons/delete-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showMsg("err", data?.error ?? `Failed to delete (${res.status})`);
        return;
      }
      showMsg("ok", "All coupons deleted");
      resetForm();
      setPage(1);
      load();
    } catch {
      showMsg("err", "Failed to delete all");
    } finally {
      setDeletingAll(false);
    }
  };

  const handleUploadCouponsCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    let rows: Record<string, string>[];
    try {
      rows = parseCSV(text);
    } catch {
      showMsg("err", "Invalid CSV format.");
      e.target.value = "";
      return;
    }
    if (rows.length === 0) {
      showMsg("err", "No data rows in CSV.");
      e.target.value = "";
      return;
    }
    const nameKey = (n: string) => (n ?? "").trim().toLowerCase();
    const sameNameStores = (name: string) =>
      stores.filter((s) => nameKey(s.name) === nameKey(name));
    const getBestStoreByName = (name: string): Store | undefined => {
      const same = sameNameStores(name);
      if (same.length === 0) return undefined;
      const withLogo = same.find((s) => (s.logoUrl ?? "").trim());
      return withLogo ?? same[0];
    };
    const storeByName = (name: string) => getBestStoreByName(name);
    const createdStores = new Map<string, Store>();
    let firstError: string | null = null;
    const BATCH_SIZE = 30;
    const getOrCreateStore = async (storeName: string): Promise<Store | null> => {
      const key = storeName.trim().toLowerCase();
      const existing = storeByName(storeName) ?? createdStores.get(key);
      if (existing) return existing;
      try {
        const res = await fetchWithTimeout("/api/stores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: storeName.trim(),
            slug: slugify(storeName.trim()),
            description: "",
          }),
        }, UPLOAD_TIMEOUT_MS);
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          if (!firstError) firstError = d?.error ?? res.statusText ?? "Store create failed";
          return null;
        }
        const store = await res.json();
        createdStores.set(key, store);
        return store;
      } catch (e) {
        if (!firstError) firstError = e instanceof Error ? (e.name === "AbortError" ? "Request timed out (45s). Live site may be slow." : e.message) : "Network error";
        return null;
      }
    };
    let batchCreated = 0;
    let batchUpdated = 0;
    const sendCouponBatch = async (batch: Record<string, unknown>[]): Promise<boolean> => {
      try {
        const res = await fetchWithTimeout("/api/coupons/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coupons: batch }),
        }, UPLOAD_TIMEOUT_MS);
        const d = await res.json().catch(() => ({}));
        if (res.ok) {
          batchCreated += typeof d.created === "number" ? d.created : 0;
          batchUpdated += typeof d.updated === "number" ? d.updated : 0;
          return true;
        }
        if (!firstError) firstError = d?.error ?? res.statusText ?? "Batch failed";
        return false;
      } catch (err) {
        if (!firstError) firstError = err instanceof Error ? (err.name === "AbortError" ? "Request timed out (45s)." : err.message) : "Network error";
        return false;
      }
    };
    setUploadingCoupons(true);
    let fail = 0;
    let skipped = 0;
    let batch: Record<string, unknown>[] = [];
    for (let i = 0; i < rows.length; i++) {
      setUploadCouponsProgress(`Uploading ${i + 1} of ${rows.length}…`);
      const r = rows[i];
      const storeName = (r["Store Name"] ?? r["store name"] ?? "").trim();
      if (!storeName) {
        skipped++;
        continue;
      }
      const store = storeByName(storeName) ?? await getOrCreateStore(storeName);
      if (!store) {
        skipped++;
        continue;
      }
      const title = (r["Title"] ?? r["title"] ?? "").trim();
      const code = (r["Code"] ?? r["code"] ?? "").trim();
      const desc = (r["Description"] ?? r["description"] ?? "").trim();
      if (!desc && !title && !code) {
        skipped++;
        continue;
      }
      const linkRaw = (r["Link"] ?? r["link"] ?? r["Coupon URL"] ?? r["coupon url"] ?? r["URL"] ?? r["url"] ?? "").trim();
      const link = linkRaw || undefined;
      const priorityRaw = r["Priority"] ?? r["priority"];
      const priority = typeof priorityRaw === "number" ? priorityRaw : Math.max(0, parseInt(String(priorityRaw ?? "0").trim(), 10) || 0);
      const verifiedRaw = r["Verified"] ?? r["verified"] ?? r["Is Verified"] ?? r["is verified"] ?? "true";
      const verifiedStr = String(verifiedRaw).trim().toLowerCase();
      const payload = {
        name: store.name,
        slug: (store.slug ?? slugify(store.name)).trim(),
        description: desc || title || code || "Deal",
        logoUrl: store.logoUrl ?? "",
        expiry: (r["Expiry Date"] ?? r["expiry date"] ?? "Dec 31, 2026").trim(),
        status: (r["Status"] ?? r["status"] ?? "Active").trim().toLowerCase() === "active" ? "enable" : "disable",
        couponType: code.length > 0 ? "code" : "deal",
        couponCode: code,
        couponTitle: title || code || "Deal",
        priority,
        active: (r["Status"] ?? r["status"] ?? "Active").trim().toLowerCase() === "active",
        verified: !["0", "false", "off", "no", "unverified", "not verified"].includes(verifiedStr),
        ...(link ? { link } : {}),
      };
      batch.push(payload);
      if (batch.length >= BATCH_SIZE) {
        const success = await sendCouponBatch(batch);
        if (!success) fail += batch.length;
        batch = [];
      }
    }
    if (batch.length > 0) {
      const success = await sendCouponBatch(batch);
      if (!success) fail += batch.length;
    }
    setUploadingCoupons(false);
    setUploadCouponsProgress(null);
    e.target.value = "";
    const okTotal = batchCreated + batchUpdated;
    if (okTotal > 0) {
      load();
      const parts: string[] = [];
      if (batchCreated > 0) parts.push(`${batchCreated} new coupon(s)`);
      if (batchUpdated > 0) parts.push(`${batchUpdated} existing updated (re-upload / no duplicates)`);
      if (parts.length === 0) parts.push(`${okTotal} processed`);
      if (createdStores.size > 0) parts.push(`${createdStores.size} store(s) created automatically.`);
      if (skipped) parts.push(`${skipped} row(s) skipped.`);
      if (fail) parts.push(`${fail} batch(es) failed.`);
      showMsg("ok", parts.join(". ") + ".");
    } else if (skipped === rows.length) showMsg("err", "No valid rows to upload. Check CSV has Store Name, and Title/Code/Description.");
    else if (fail > 0) showMsg("err", firstError ? `Upload failed: ${firstError}` : `All ${fail} row(s) failed.`);
  };

  const handleExportCsv = async () => {
    try {
      const res = await fetch(
        `/api/coupons?page=1&limit=0&status=${statusFilter}&q=${encodeURIComponent(searchQuery.trim())}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      const list = data?.coupons && Array.isArray(data.coupons) ? data.coupons : [];
      const headers = ["Store Name", "Row ID", "Title", "Code", "Description", "Expiry Date", "Status"];
      const rows = list.map((c: Store) => [
      c.name ?? "",
      c.id ?? "",
      c.couponTitle ?? "",
      c.couponCode ?? "",
      (c.description ?? "").slice(0, 100),
      c.expiry ?? "",
      c.status !== "disable" ? "Active" : "Inactive",
    ]);
      const csv = [headers.join(","), ...rows.map((r: string[]) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `coupons-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
      showMsg("ok", "CSV exported");
    } catch {
      showMsg("err", "Export failed");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name?.trim();
    if (!name) {
      showMsg("err", "Store Name is required");
      return;
    }
    if (form.couponType === "code" && !form.couponCode?.trim()) {
      showMsg("err", "Coupon Code is required when type is Code");
      return;
    }
    setSubmitting(true);
    try {
      const selectedStore = form.selectedStoreId ? stores.find((s) => s.id === form.selectedStoreId) : null;
      const slug =
        selectedStore
          ? (selectedStore.slug ?? slugify(selectedStore.name ?? "")).trim()
          : (form.slug?.trim() || slugify(name));
      const payload = {
        name,
        slug,
        description: form.description?.trim() ?? "",
        logoUrl: form.logoUrl?.trim() ?? "",
        expiry: form.expiry?.trim() ?? "Dec 31, 2026",
        link: form.link?.trim() || undefined,
        status: form.active !== false ? "enable" : "disable",
        couponType: form.couponType ?? "code",
        couponCode: form.couponCode?.trim() ?? "",
        couponTitle: form.couponTitle?.trim() ?? "",
        showCodeButtonText: form.showCodeButtonText?.trim() || undefined,
        badgeLabel: form.badgeLabel?.trim() || undefined,
        priority: typeof form.priority === "number" ? form.priority : 0,
        active: form.active !== false,
        verified: form.verified !== false,
      };
      if (editingId) {
        const res = await fetch("/api/coupons", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d?.error ?? "Update failed");
        }
        showMsg("ok", "Coupon updated successfully.");
      } else {
        const res = await fetch("/api/coupons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d?.error ?? "Create failed");
        }
        showMsg("ok", "Coupon created successfully.");
      }
      resetForm();
      load();
    } catch (err) {
      showMsg("err", err instanceof Error ? err.message : "Request failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      const res = await fetch(`/api/coupons?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      showMsg("ok", "Coupon deleted");
      setSelectedCouponIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      if (editingId === id) resetForm();
      load();
    } catch {
      showMsg("err", "Failed to delete coupon");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedCouponIds.size === 0) {
      showMsg("err", "Select one or more coupons first.");
      return;
    }
    if (!confirm(`Delete ${selectedCouponIds.size} selected coupon(s)?`)) return;
    setDeletingSelected(true);
    try {
      for (const id of selectedCouponIds) {
        await fetch(`/api/coupons?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      }
      showMsg("ok", `${selectedCouponIds.size} coupon(s) deleted.`);
      setSelectedCouponIds(new Set());
      if (editingId && selectedCouponIds.has(editingId)) resetForm();
      load();
    } catch {
      showMsg("err", "Failed to delete some coupons.");
    } finally {
      setDeletingSelected(false);
    }
  };

  const handleRemoveDuplicateCoupons = async () => {
    setRemovingDuplicates(true);
    try {
      const res = await fetch("/api/coupons", { cache: "no-store" });
      const all = await res.json().catch(() => []);
      const list = Array.isArray(all) ? all : (all?.coupons ?? []);
      const key = (c: Store) =>
        `${(c.name ?? "").trim().toLowerCase()}|${(c.couponTitle ?? "").trim().toLowerCase()}|${(c.couponCode ?? "").trim().toLowerCase()}`;
      const byKey: Record<string, Store[]> = {};
      for (const c of list) {
        const k = key(c);
        if (!byKey[k]) byKey[k] = [];
        byKey[k].push(c);
      }
      const toDelete: Store[] = [];
      for (const group of Object.values(byKey)) {
        if (group.length <= 1) continue;
        toDelete.push(...group.slice(1));
      }
      if (toDelete.length === 0) {
        showMsg("ok", "No duplicate coupons (same store + title + code) found.");
        setRemovingDuplicates(false);
        return;
      }
      if (!confirm(`Remove ${toDelete.length} duplicate coupon(s)? One per store+title+code will be kept.`)) {
        setRemovingDuplicates(false);
        return;
      }
      for (const c of toDelete) {
        await fetch(`/api/coupons?id=${encodeURIComponent(c.id)}`, { method: "DELETE" });
      }
      showMsg("ok", `Removed ${toDelete.length} duplicate coupon(s).`);
      load();
    } catch {
      showMsg("err", "Failed to remove duplicates");
    } finally {
      setRemovingDuplicates(false);
    }
  };

  const inputClass =
    "w-full rounded border-2 border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm";

  const getBestStoreForName = (name: string): Store | undefined => {
    const key = (n: string) => (n ?? "").trim().toLowerCase();
    const same = stores.filter((s) => key(s.name) === key(name));
    if (same.length === 0) return undefined;
    const withLogo = same.find((s) => (s.logoUrl ?? "").trim());
    return withLogo ?? same[0];
  };

  const showForm = showCreateForm || !!editingId;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Manage Coupons
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs sm:text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
          >
            Export CSV
          </button>
          <input
            ref={uploadCouponsInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleUploadCouponsCsv}
            disabled={uploadingCoupons}
          />
          <button
            type="button"
            onClick={() => uploadCouponsInputRef.current?.click()}
            disabled={uploadingCoupons}
            className="rounded-lg bg-amber-500 px-3 py-2 text-xs sm:text-sm font-medium text-white hover:bg-amber-400 transition-colors disabled:opacity-70"
          >
            {uploadingCoupons ? (uploadCouponsProgress ?? "Uploading…") : "Upload"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm({ couponType: "deal", priority: 0, active: true, verified: true, selectedStoreId: "" });
              setShowCreateForm(true);
            }}
            className="rounded-lg bg-blue-600 px-3 py-2 text-xs sm:text-sm font-medium text-white hover:bg-blue-500 transition-colors"
          >
            New Coupon
          </button>
          <button
            type="button"
            onClick={handleDeleteSelected}
            disabled={deletingSelected || selectedCouponIds.size === 0}
            className="rounded-lg bg-red-500 px-3 py-2 text-xs sm:text-sm font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            title={selectedCouponIds.size > 0 ? `Delete ${selectedCouponIds.size} selected` : "Select coupons to delete"}
          >
            {deletingSelected ? "Deleting…" : `Delete selected${selectedCouponIds.size > 0 ? ` (${selectedCouponIds.size})` : ""}`}
          </button>
          <button
            type="button"
            onClick={handleDeleteAll}
            disabled={deletingAll}
            className="rounded-lg bg-red-600 px-3 py-2 text-xs sm:text-sm font-medium text-white hover:bg-red-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {deletingAll ? "Deleting…" : "Delete All"}
          </button>
          <button
            type="button"
            onClick={handleRemoveDuplicateCoupons}
            disabled={removingDuplicates}
            className="rounded-lg bg-amber-600 px-3 py-2 text-xs sm:text-sm font-medium text-white hover:bg-amber-500 transition-colors disabled:opacity-70"
            title="Keep one coupon per store+title+code, delete the rest"
          >
            {removingDuplicates ? "Removing…" : "Remove duplicate coupons"}
          </button>
          <button
            type="button"
            onClick={async () => {
              setSyncingSlugs(true);
              try {
                const res = await fetch("/api/coupons/sync-slugs", { method: "POST" });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                  showMsg("err", data?.error ?? "Sync failed");
                  return;
                }
                const n = typeof data?.updated === "number" ? data.updated : 0;
                showMsg("ok", n === 0 ? "All coupon slugs already match their store." : `Updated ${n} coupon slug(s) to match store slugs.`);
                load();
              } catch {
                showMsg("err", "Sync request failed");
              } finally {
                setSyncingSlugs(false);
              }
            }}
            disabled={syncingSlugs}
            className="rounded-lg bg-amber-600 px-3 py-2 text-xs sm:text-sm font-medium text-white hover:bg-amber-500 transition-colors disabled:opacity-70"
            title="Set every coupon's slug to its store's slug (by name). Use after changing store slugs."
          >
            {syncingSlugs ? "Syncing…" : "Sync coupon slugs"}
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
        <input
          type="text"
          placeholder="Store name or Row ID..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          className="w-full sm:flex-1 sm:min-w-[200px] sm:max-w-xl rounded-lg border-2 border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:ring-2 focus:ring-slate-400/30 outline-none"
        />
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-slate-700 shrink-0">Status:</span>
          {(["all", "enable", "disable"] as const).map((s) => (
            <label key={s} className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="radio"
                name="statusFilter"
                checked={statusFilter === s}
                onChange={() => { setStatusFilter(s); setPage(1); }}
              />
              {s === "all" ? "All" : s === "enable" ? "Enable" : "Disable"}
            </label>
          ))}
        </div>
      </div>
      <p className="text-sm text-slate-500">
        Each coupon has its own Row ID; one store can have multiple coupons (same Store Name).
      </p>

      {message && (
        <div
          className={`rounded-lg border-2 px-4 py-3 text-sm font-medium ${
            message.type === "ok"
              ? "bg-emerald-100 border-emerald-500 text-emerald-900"
              : "bg-red-100 border-red-500 text-red-900"
          }`}
        >
          {message.text}
        </div>
      )}

      {showForm && (
      <form
        onSubmit={handleSave}
        className="rounded-xl border-2 border-stone-200 bg-white p-4 sm:p-6 shadow-md space-y-4"
      >
        <h2 className="text-lg font-semibold text-stone-800 pb-2 border-b border-stone-200">
          {editingId ? "Edit coupon" : "Add coupon"}
        </h2>

        {/* Select Store (Optional) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Select Store (Optional)
          </label>
          <select
            value={form.selectedStoreId ?? ""}
            onChange={(e) => {
              const id = e.target.value;
              const store = id ? stores.find((s) => s.id === id) : null;
              setForm((f) => ({
                ...f,
                selectedStoreId: id,
                name: store ? store.name : f.name,
                slug: store?.slug ?? (store ? slugify(store.name) : f.slug),
              }));
            }}
            className="max-w-xs rounded border-2 border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
          >
            <option value="">— Add new store —</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Coupon Type */}
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">
            Coupon Type
          </label>
          <div className="flex gap-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="couponType"
                checked={form.couponType === "code"}
                onChange={() => setForm((f) => ({ ...f, couponType: "code" }))}
                className="h-4 w-4 border-stone-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-sm text-stone-700">Code</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="couponType"
                checked={form.couponType === "deal"}
                onChange={() => setForm((f) => ({ ...f, couponType: "deal" }))}
                className="h-4 w-4 border-stone-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-sm text-stone-700">Deal</span>
            </label>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            Select whether this is a coupon code or a deal. Frontend will show &quot;Get Code&quot; for codes and
            &quot;Get Deal&quot; for deals (unless you set custom button text below).
          </p>
        </div>

        {/* Store Name * + Coupon Code */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Store Name *
            </label>
            <input
              type="text"
              required
              value={form.name ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Nike, Walmart"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Coupon Code {form.couponType === "code" ? "*" : "(Optional)"}
            </label>
            <input
              type="text"
              required={form.couponType === "code"}
              value={form.couponCode ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, couponCode: e.target.value }))}
              placeholder="e.g. SAVE20"
              className={inputClass}
            />
          </div>
        </div>

        {/* Coupon Title */}
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Coupon Title (Optional)
          </label>
          <input
            type="text"
            value={form.couponTitle ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, couponTitle: e.target.value }))}
            placeholder="e.g. 20% Off Sitewide"
            className={inputClass}
          />
        </div>

        {/* Custom reveal-code button (screenshot-style: multilingual examples) */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-800">
            Custom button text (Optional)
          </label>
          <input
            type="text"
            value={form.showCodeButtonText ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, showCodeButtonText: e.target.value }))}
            placeholder='e.g., "Obtenir le code", "Ver oferta", "कोड प्राप्त करें"'
            className={inputClass}
          />
          <p className="mt-1 text-xs text-stone-500">
            Overrides the main action label on coupon cards for both Code and Deal. Leave empty for defaults:
            &quot;Get Code&quot; (code, or deal with an optional code) or &quot;Get Deal&quot; (deal with no code).
          </p>
        </div>

        {/* Badge (optional) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Badge (Optional)
          </label>
          <input
            type="text"
            value={form.badgeLabel ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, badgeLabel: e.target.value }))}
            placeholder="e.g. Free Shipping, 20% OFF"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-stone-500">
            Shown on the coupon card (e.g. in a circle). Leave empty for default.
          </p>
        </div>

        {/* Logo URL (Optional) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Logo URL (Optional)
          </label>
          <input
            type="url"
            value={form.logoUrl ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
            placeholder="https://..."
            className={inputClass}
          />
        </div>

        {/* Description (Optional) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Description (Optional)
          </label>
          <textarea
            value={form.description ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Coupon or deal description"
            rows={3}
            className={`${inputClass} resize-y min-h-[80px]`}
          />
        </div>

        {/* Coupon URL */}
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Coupon URL (Where user goes when clicking &quot;Get Deal&quot; / &quot;Get Code&quot;)
          </label>
          <input
            type="url"
            value={form.link ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
            placeholder="https://example.com/coupon-page"
            className={inputClass}
          />
        </div>

        {/* Expiry + Priority */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Expiry Date (Optional)
            </label>
            <input
              type="text"
              value={form.expiry ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, expiry: e.target.value }))}
              placeholder="Dec 31, 2026"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Priority
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={form.priority ?? 0}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "");
                setForm((f) => ({ ...f, priority: v === "" ? 0 : parseInt(v, 10) }));
              }}
              className="w-24 rounded border-2 border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
            />
            <p className="mt-1 text-xs text-stone-500">Lower number = shown first.</p>
          </div>
        </div>

        {/* Verified Symbol */}
        <div>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={form.verified !== false}
              onChange={(e) => setForm((f) => ({ ...f, verified: e.target.checked }))}
              className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm font-medium text-stone-700">Show Verified Symbol</span>
          </label>
        </div>

        {/* Active */}
        <div>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={form.active !== false}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-sm font-medium text-stone-700">Active</span>
          </label>
        </div>

        {/* Submit */}
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded border-2 border-sky-600 bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50"
          >
            {submitting
              ? (editingId ? "Updating…" : "Creating…")
              : editingId
                ? "Update Coupon"
                : "Create Coupon"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded border-2 border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>
      )}

      {/* Coupons table – reference layout */}
      <div className="rounded-xl border-2 border-slate-200 bg-white shadow-sm overflow-hidden -mx-4 sm:mx-0">
        {loading ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
            <p className="mt-3 text-sm text-slate-500">Loading…</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-sm text-slate-500">
            No coupons yet. Click &quot;New Coupon&quot; to add one.
          </div>
        ) : (
          <>
          <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="text-left font-semibold text-slate-700 px-2 sm:px-4 py-2 sm:py-3 w-10">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300"
                      aria-label="Select all"
                      checked={coupons.length > 0 && coupons.every((c) => selectedCouponIds.has(c.id))}
                      onChange={(e) => {
                        if (e.target.checked)
                          setSelectedCouponIds(new Set(coupons.map((c) => c.id)));
                        else
                          setSelectedCouponIds(new Set());
                      }}
                    />
                  </th>
                  <th className="text-left font-semibold text-slate-700 px-2 sm:px-4 py-2 sm:py-3">Logo</th>
                  <th className="text-left font-semibold text-slate-700 px-2 sm:px-4 py-2 sm:py-3">Store Name</th>
                  <th className="text-left font-semibold text-slate-700 px-2 sm:px-4 py-2 sm:py-3">Row ID</th>
                  <th className="text-left font-semibold text-slate-700 px-2 sm:px-4 py-2 sm:py-3">Title</th>
                  <th className="text-left font-semibold text-slate-700 px-2 sm:px-4 py-2 sm:py-3">Code</th>
                  <th className="text-left font-semibold text-slate-700 px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">Description</th>
                  <th className="text-left font-semibold text-slate-700 px-2 sm:px-4 py-2 sm:py-3 hidden lg:table-cell">Expiry Date</th>
                  <th className="text-left font-semibold text-slate-700 px-2 sm:px-4 py-2 sm:py-3">Status</th>
                  <th className="text-left font-semibold text-slate-700 px-2 sm:px-4 py-2 sm:py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c, i) => {
                  const store = getBestStoreForName(c.name ?? "");
                  const logoUrl = store?.logoUrl || c.logoUrl;
                  return (
                  <tr
                    key={c.id}
                    className={`border-b border-slate-100 hover:bg-slate-50/50 ${
                      i % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                    }`}
                  >
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300"
                        aria-label={`Select ${c.name}`}
                        checked={selectedCouponIds.has(c.id)}
                        onChange={(e) => {
                          setSelectedCouponIds((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(c.id);
                            else next.delete(c.id);
                            return next;
                          });
                        }}
                      />
                    </td>
                    <td className="px-4 py-2">
                      {logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logoUrl} alt="" className="h-8 w-8 object-contain rounded" />
                      ) : (
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded bg-slate-200 text-xs font-medium text-slate-500">
                          {c.name?.charAt(0) ?? "?"}
                        </span>
                      )}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-slate-900">{c.name ?? "–"}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 font-mono text-sm text-slate-700">{(page - 1) * limit + i + 1}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-slate-700 max-w-[140px] sm:max-w-[180px] truncate" title={c.couponTitle ?? ""}>{c.couponTitle ?? "–"}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-slate-800">{c.couponCode ?? "–"}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-slate-600 max-w-[200px] truncate hidden md:table-cell" title={c.description ?? ""}>{c.description ?? "–"}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-slate-600 hidden lg:table-cell">{c.expiry ?? "–"}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          c.status !== "disable"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {c.status !== "disable" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const store = getBestStoreForName(c.name ?? "");
                            setShowCreateForm(true);
                            setForm({
                              id: c.id,
                              name: c.name,
                              slug: store?.slug ?? c.slug ?? (c.name ? slugify(c.name) : ""),
                              selectedStoreId: store?.id ?? "",
                              description: c.description,
                              logoUrl: c.logoUrl,
                              expiry: c.expiry,
                              link: c.link,
                              status: c.status,
                              couponType: c.couponType ?? "deal",
                              couponCode: c.couponCode,
                              couponTitle: c.couponTitle,
                              showCodeButtonText: c.showCodeButtonText,
                              badgeLabel: c.badgeLabel,
                              priority: c.priority ?? 0,
                              active: c.status !== "disable",
                              verified: c.verified !== false,
                            });
                            setEditingId(c.id);
                          }}
                          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id)}
                          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {total > limit && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/50 px-3 sm:px-4 py-3">
              <p className="text-sm text-slate-600">
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border-2 border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-600">
                  Page {page} of {Math.ceil(total / limit) || 1}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(Math.ceil(total / limit), p + 1))}
                  disabled={page >= Math.ceil(total / limit)}
                  className="rounded-lg border-2 border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}
