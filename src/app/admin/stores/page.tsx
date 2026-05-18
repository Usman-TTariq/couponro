"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Store } from "@/types/store";
import { STORE_CATEGORIES } from "@/lib/store-categories";
import { slugify } from "@/lib/slugify";
import { parseCSV } from "@/lib/parse-csv";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

const inputClass =
  "w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-500 focus:border-slate-500 focus:ring-2 focus:ring-slate-400/30 outline-none transition-colors text-sm";
const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";
const sectionTitle = "text-sm font-bold text-slate-800 uppercase tracking-wide mb-3";

type FormState = Partial<Store> & {
  shoppingTipsBulletsText?: string;
  faqItems?: { question: string; answer: string }[];
};

function sortCouponsByPriority(list: Store[]): Store[] {
  return [...list].sort((a, b) => {
    const pa = a.priority ?? 999;
    const pb = b.priority ?? 999;
    if (pa !== pb) return pa - pb;
    return (a.couponTitle ?? "").localeCompare(b.couponTitle ?? "");
  });
}

export default function AdminStoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "enable" | "disable">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<FormState>({
    autoGenerateSlug: true,
    logoUploadMethod: "url",
    faqItems: [],
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [coupons, setCoupons] = useState<Store[]>([]);
  const [uploadingStores, setUploadingStores] = useState(false);
  const [uploadStoresProgress, setUploadStoresProgress] = useState<string | null>(null);
  const [removingDuplicates, setRemovingDuplicates] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [couponsModalStore, setCouponsModalStore] = useState<Store | null>(null);
  const [modalCouponOrder, setModalCouponOrder] = useState<Store[]>([]);
  const [dragCouponId, setDragCouponId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [savingCouponOrder, setSavingCouponOrder] = useState(false);
  const [initialEditName, setInitialEditName] = useState<string | null>(null);
  const uploadStoresInputRef = useRef<HTMLInputElement>(null);

  const loadStoresOnly = async () => {
    const storesRes = await fetchWithTimeout("/api/stores", { cache: "no-store" }, 30000);
    const storesData = await storesRes.json();
    setStores(Array.isArray(storesData) ? storesData : []);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [storesRes, couponsRes] = await Promise.all([
        fetchWithTimeout("/api/stores", { cache: "no-store" }, 30000),
        fetchWithTimeout("/api/coupons", { cache: "no-store" }, 30000),
      ]);
      const storesData = await storesRes.json();
      const couponsData = await couponsRes.json().catch(() => []);
      setStores(Array.isArray(storesData) ? storesData : []);
      setCoupons(Array.isArray(couponsData) ? couponsData : []);
    } catch (e) {
      const msg = e instanceof Error && e.name === "AbortError"
        ? "Request timed out. Check Supabase connection."
        : "Failed to load stores";
      setMessage({ type: "err", text: msg });
    } finally {
      setLoading(false);
    }
  };

  const couponCountByStore: Record<string, { total: number; active: number; inactive: number }> = {};
  for (const c of coupons) {
    const name = (c.name ?? "").trim();
    if (!name) continue;
    if (!couponCountByStore[name]) couponCountByStore[name] = { total: 0, active: 0, inactive: 0 };
    couponCountByStore[name].total += 1;
    if (c.status !== "disable") couponCountByStore[name].active += 1;
    else couponCountByStore[name].inactive += 1;
  }

  const storeNameKey = (name: string) => (name ?? "").trim().toLowerCase();

  const getCouponsForStore = (storeName: string) =>
    coupons.filter((c) => storeNameKey(c.name ?? "") === storeNameKey(storeName));

  const openCouponsModal = (store: Store) => {
    const list = sortCouponsByPriority(getCouponsForStore(store.name ?? ""));
    setModalCouponOrder(list);
    setCouponsModalStore(store);
    setDragCouponId(null);
    setDragOverIndex(null);
  };

  const closeCouponsModal = () => {
    setCouponsModalStore(null);
    setModalCouponOrder([]);
    setDragCouponId(null);
    setDragOverIndex(null);
  };

  const persistCouponPriorities = async (ordered: Store[]) => {
    setSavingCouponOrder(true);
    try {
      for (let i = 0; i < ordered.length; i++) {
        const c = ordered[i];
        const res = await fetch("/api/coupons", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...c, priority: i }),
        });
        if (!res.ok) throw new Error("Failed to save order");
      }
      const priorityById = new Map(ordered.map((c, i) => [c.id, i]));
      setCoupons((prev) =>
        prev.map((c) =>
          priorityById.has(c.id) ? { ...c, priority: priorityById.get(c.id) } : c
        )
      );
      showMsg("ok", "Coupon order saved.");
    } catch {
      showMsg("err", "Failed to save coupon order");
    } finally {
      setSavingCouponOrder(false);
    }
  };

  const handleCouponDrop = async (targetIndex: number) => {
    if (!dragCouponId) return;
    const fromIndex = modalCouponOrder.findIndex((c) => c.id === dragCouponId);
    if (fromIndex < 0 || fromIndex === targetIndex) {
      setDragCouponId(null);
      setDragOverIndex(null);
      return;
    }
    const next = [...modalCouponOrder];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(targetIndex, 0, moved);
    const withPriority = next.map((c, i) => ({ ...c, priority: i }));
    setModalCouponOrder(withPriority);
    setDragCouponId(null);
    setDragOverIndex(null);
    await persistCouponPriorities(withPriority);
  };

  useEffect(() => {
    load();
  }, []);

  const showMsg = (type: "ok" | "err", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const resetForm = () => {
    setForm({
      autoGenerateSlug: true,
      logoUploadMethod: "url",
      faqItems: [],
    });
    setEditingId(null);
    setIsEditing(false);
    setShowCreateForm(false);
    setLogoFile(null);
    setInitialEditName(null);
  };

  const handleDeleteAll = async () => {
    if (!confirm("Delete ALL stores? This cannot be undone.")) return;
    try {
      for (const s of stores) {
        await fetch(`/api/stores?id=${encodeURIComponent(s.id)}`, { method: "DELETE" });
      }
      showMsg("ok", "All stores deleted");
      resetForm();
      load();
    } catch {
      showMsg("err", "Failed to delete all");
    }
  };

  const filteredStores = stores.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (s.name ?? "").toLowerCase().includes(q) ||
        (s.slug ?? "").toLowerCase().includes(q) ||
        (s.subStoreName ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredStores.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStores.map((s) => s.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected store(s)? This cannot be undone.`)) return;
    setBulkDeleting(true);
    let deleted = 0;
    let failed = 0;
    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/stores?id=${encodeURIComponent(id)}`, { method: "DELETE" });
        if (res.ok) deleted++;
        else failed++;
      } catch {
        failed++;
      }
    }
    setBulkDeleting(false);
    setSelectedIds(new Set());
    if (deleted > 0) {
      showMsg("ok", `Deleted ${deleted} store(s)${failed > 0 ? `, ${failed} failed` : ""}`);
      if (editingId && selectedIds.has(editingId)) resetForm();
      load();
    } else {
      showMsg("err", "Failed to delete selected stores");
    }
  };

  const handleRemoveDuplicateStores = async () => {
    const nameKey = (n: string) => (n ?? "").trim().toLowerCase();
    const byName: Record<string, Store[]> = {};
    for (const s of stores) {
      const k = nameKey(s.name);
      if (!byName[k]) byName[k] = [];
      byName[k].push(s);
    }
    const toDelete: Store[] = [];
    for (const group of Object.values(byName)) {
      if (group.length <= 1) continue;
      const sorted = [...group].sort((a, b) => ((b.logoUrl ?? "").trim() ? 1 : 0) - ((a.logoUrl ?? "").trim() ? 1 : 0));
      toDelete.push(...sorted.slice(1));
    }
    if (toDelete.length === 0) {
      showMsg("ok", "No duplicate stores (same name) found.");
      return;
    }
    if (!confirm(`Remove ${toDelete.length} duplicate store(s)? The store with logo will be kept for each name.`)) return;
    setRemovingDuplicates(true);
    try {
      for (const s of toDelete) {
        await fetch(`/api/stores?id=${encodeURIComponent(s.id)}`, { method: "DELETE" });
      }
      showMsg("ok", `Removed ${toDelete.length} duplicate store(s).`);
      load();
    } catch {
      showMsg("err", "Failed to remove duplicates");
    } finally {
      setRemovingDuplicates(false);
    }
  };

  const handleUploadStoresCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    let rows: Record<string, string>[];
    try {
      rows = parseCSV(text);
    } catch (err) {
      showMsg("err", "Invalid CSV format.");
      e.target.value = "";
      return;
    }
    if (rows.length === 0) {
      showMsg("err", "No data rows in CSV.");
      e.target.value = "";
      return;
    }
    setUploadingStores(true);
    let created = 0;
    let updated = 0;
    let duplicatesRemoved = 0;
    let fail = 0;
    const nameKey = (n: string) => (n ?? "").trim().toLowerCase();
    let storesList = [...stores];
    for (let i = 0; i < rows.length; i++) {
      setUploadStoresProgress(`Uploading ${i + 1} of ${rows.length}…`);
      const r = rows[i];
      const name = (r["Store Name"] ?? r["store name"] ?? "").trim();
      if (!name) continue;
      const sameNameStores = storesList.filter((s) => nameKey(s.name) === nameKey(name));
      const keepStore = sameNameStores.length > 0
        ? [...sameNameStores].sort((a, b) => ((b.logoUrl ?? "").trim() ? 1 : 0) - ((a.logoUrl ?? "").trim() ? 1 : 0))[0]
        : null;
      const slug = (r["Slug"] ?? r["slug"] ?? "").trim() || slugify(name);
      const category = (r["Category"] ?? r["category"] ?? "").trim();
      const payload = {
        name,
        slug,
        description: (r["Description"] ?? r["description"] ?? "").trim(),
        logoUrl: (r["Logo URL"] ?? r["logo url"] ?? "").trim(),
        trackingUrl: (r["Tracking URL"] ?? r["tracking url"] ?? "").trim(),
        countryCodes: (r["Country Codes"] ?? r["country codes"] ?? "").trim(),
        storeWebsiteUrl: (r["Website URL"] ?? r["website url"] ?? "").trim(),
        categories: category ? category.split(",").map((c) => c.trim()).filter(Boolean) : [],
        status: "enable",
      };
      try {
        if (keepStore) {
          const res = await fetch("/api/stores", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, id: keepStore.id }),
          });
          if (res.ok) {
            updated++;
            for (const dup of sameNameStores) {
              if (dup.id !== keepStore.id) {
                try {
                  await fetch(`/api/stores?id=${encodeURIComponent(dup.id)}`, { method: "DELETE" });
                  duplicatesRemoved++;
                  storesList = storesList.filter((s) => s.id !== dup.id);
                } catch {
                  /* ignore */
                }
              }
            }
          } else fail++;
        } else {
          const res = await fetch("/api/stores", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (res.ok) created++;
          else fail++;
        }
      } catch {
        fail++;
      }
    }
    setUploadingStores(false);
    setUploadStoresProgress(null);
    e.target.value = "";
    if (created > 0 || updated > 0 || duplicatesRemoved > 0) {
      load();
      const parts = [];
      if (created) parts.push(`${created} created`);
      if (updated) parts.push(`${updated} updated`);
      if (duplicatesRemoved) parts.push(`${duplicatesRemoved} duplicate(s) removed`);
      showMsg("ok", `Store(s): ${parts.join(", ")}.${fail > 0 ? ` ${fail} failed.` : ""}`);
    } else if (fail > 0) showMsg("err", `All ${fail} row(s) failed to upload.`);
  };

  const handleExportCsv = () => {
    const headers = ["Store ID", "Store Name", "Slug", "Country", "Category", "Tracking Link", "Status"];
    const rows = filteredStores.map((s) => [
      s.id,
      s.name ?? "",
      s.slug ?? "",
      (s.countryCodes ?? "").split(",")[0]?.trim() ?? "",
      (s.categories ?? [])[0] ?? "",
      s.trackingUrl ?? s.storeWebsiteUrl ?? "",
      s.status ?? "enable",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `stores-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    showMsg("ok", "CSV exported");
  };

  const setFormField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      showMsg("err", "File too large. Maximum 1 MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      showMsg("err", "Please select an image (JPEG, PNG, GIF, WebP, SVG).");
      return;
    }
    setLogoFile(file);
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await fetch("/api/upload/logo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? "Upload failed");
      }
      if (data?.url) {
        setFormField("logoUrl", data.url);
        showMsg("ok", "Logo uploaded.");
      }
    } catch (err) {
      showMsg("err", err instanceof Error ? err.message : "Logo upload failed");
    } finally {
      setLogoUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name?.trim();
    if (!name) {
      showMsg("err", "Store Name is required");
      return;
    }
    setSaving(true);
    try {
      const slug =
        isEditing && form.autoGenerateSlug === false
          ? (form.slug ?? "").trim() || slugify(name)
          : form.autoGenerateSlug !== false
            ? slugify(name)
            : (form.slug ?? "").trim() || slugify(name);

      const faqs = form.faqItems?.filter((f) => f.question.trim() || f.answer.trim()) ?? [];
      const shoppingTipsBullets =
        typeof form.shoppingTipsBulletsText === "string"
          ? form.shoppingTipsBulletsText
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
          : form.shoppingTipsBullets ?? [];

      const payload: Record<string, unknown> = {
        name,
        slug,
        autoGenerateSlug: isEditing
          ? form.autoGenerateSlug === false
          : form.autoGenerateSlug ?? true,
        subStoreName: form.subStoreName?.trim() || undefined,
        storePageHeading: form.storePageHeading?.trim() || undefined,
        logoUrl: form.logoUrl?.trim() || "",
        logoAltText: form.logoAltText?.trim() || undefined,
        logoUploadMethod: form.logoUploadMethod ?? "url",
        description: form.description?.trim() || "",
        trackingUrl: form.trackingUrl?.trim() || undefined,
        countryCodes: form.countryCodes?.trim() || undefined,
        storeWebsiteUrl: form.storeWebsiteUrl?.trim() || undefined,
        categories: form.categories ?? [],
        whyTrustUs: form.whyTrustUs?.trim() || undefined,
        moreInformation: form.moreInformation?.trim() || undefined,
        sidebarContent: form.sidebarContent?.trim() || undefined,
        moreAboutStore: form.moreAboutStore?.trim() || undefined,
        shoppingTipsTitle: form.shoppingTipsTitle?.trim() || undefined,
        shoppingTipsBullets,
        faqs: faqs.length ? faqs : undefined,
        seoPageTitle: form.seoPageTitle?.trim() || undefined,
        seoMetaDescription: form.seoMetaDescription?.trim() || undefined,
        markAsTrending: form.markAsTrending ?? false,
        status: form.status ?? "enable",
      };

      if (isEditing) {
        const storeId = (editingId ?? form.id ?? "").trim();
        if (!storeId) {
          showMsg(
            "err",
            "Store ID is missing. Click Cancel, then Edit on the store again before saving."
          );
          return;
        }
        const nameBeforeEdit = initialEditName;
        const res = await fetch("/api/stores", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, id: storeId }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error((d?.error as string) ?? "Update failed");
        }
        showMsg("ok", "Store updated");
        resetForm();
        await loadStoresOnly();
        if (nameBeforeEdit) {
          const oldKey = nameBeforeEdit.trim().toLowerCase();
          const newKey = name.trim().toLowerCase();
          if (oldKey !== newKey) {
            setCoupons((prev) =>
              prev.map((c) =>
                (c.name ?? "").trim().toLowerCase() === oldKey
                  ? { ...c, name, slug }
                  : c
              )
            );
          } else if (slug) {
            setCoupons((prev) =>
              prev.map((c) =>
                (c.name ?? "").trim().toLowerCase() === newKey
                  ? { ...c, slug }
                  : c
              )
            );
          }
        }
        return;
      } else {
        const res = await fetch("/api/stores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error((d?.error as string) ?? "Create failed");
        }
        showMsg("ok", "Store created");
      }
      resetForm();
      load();
    } catch (err) {
      showMsg("err", err instanceof Error ? err.message : "Request failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this store?")) return;
    try {
      const res = await fetch(`/api/stores?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      showMsg("ok", "Store deleted");
      if (editingId === id) resetForm();
      load();
    } catch {
      showMsg("err", "Failed to delete store");
    }
  };

  const openEdit = (s: Store) => {
    const rowId = (s.id ?? "").trim();
    if (!rowId) {
      showMsg("err", "This store has no database ID. Refresh the page and try again.");
      return;
    }
    setIsEditing(true);
    setShowCreateForm(true);
    setForm({
      id: rowId,
      name: s.name,
      slug: s.slug ?? slugify(s.name ?? ""),
      autoGenerateSlug: false,
      subStoreName: s.subStoreName,
      storePageHeading: s.storePageHeading,
      logoUrl: s.logoUrl,
      logoAltText: s.logoAltText,
      logoUploadMethod: s.logoUploadMethod ?? "url",
      description: s.description,
      trackingUrl: s.trackingUrl,
      countryCodes: s.countryCodes,
      storeWebsiteUrl: s.storeWebsiteUrl,
      categories: s.categories ?? [],
      whyTrustUs: s.whyTrustUs,
      moreInformation: s.moreInformation,
      sidebarContent: s.sidebarContent,
      moreAboutStore: s.moreAboutStore,
      shoppingTipsTitle: s.shoppingTipsTitle,
      shoppingTipsBullets: s.shoppingTipsBullets,
      shoppingTipsBulletsText: (s.shoppingTipsBullets ?? []).join("\n"),
      faqItems: (s.faqs ?? []).length ? s.faqs : [],
      seoPageTitle: s.seoPageTitle,
      seoMetaDescription: s.seoMetaDescription,
      markAsTrending: s.markAsTrending ?? false,
      status: s.status ?? "enable",
    });
    setEditingId(rowId);
    setInitialEditName(s.name ?? "");
  };

  const addFaq = () => {
    setForm((f) => ({
      ...f,
      faqItems: [...(f.faqItems ?? []), { question: "", answer: "" }],
    }));
  };

  const updateFaq = (index: number, field: "question" | "answer", value: string) => {
    setForm((f) => {
      const list = [...(f.faqItems ?? [])];
      if (!list[index]) list[index] = { question: "", answer: "" };
      list[index] = { ...list[index], [field]: value };
      return { ...f, faqItems: list };
    });
  };

  const removeFaq = (index: number) => {
    setForm((f) => ({
      ...f,
      faqItems: (f.faqItems ?? []).filter((_, i) => i !== index),
    }));
  };

  const toggleCategory = (cat: string) => {
    setForm((f) => {
      const list = f.categories ?? [];
      const has = list.includes(cat);
      return {
        ...f,
        categories: has ? list.filter((c) => c !== cat) : [...list, cat],
      };
    });
  };

  const editingStoreId = isEditing ? (editingId ?? form.id ?? "").trim() : "";
  const showForm = showCreateForm || isEditing;

  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
        Manage Stores
      </h1>

      {/* Filters + Search + Action buttons – reference layout */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-slate-700">Status:</span>
          {(["all", "enable", "disable"] as const).map((s) => (
            <label key={s} className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="radio"
                name="statusFilter"
                checked={statusFilter === s}
                onChange={() => setStatusFilter(s)}
                className="text-slate-600"
              />
              {s === "all" ? "All" : s === "enable" ? "Enable" : "Disable"}
            </label>
          ))}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Enter store name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-52 rounded-lg border-2 border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:ring-2 focus:ring-slate-400/30 outline-none"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
          >
            Export Stores (CSV)
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCreateForm(true);
              setTimeout(() => document.getElementById("logo-upload")?.scrollIntoView({ behavior: "smooth" }), 100);
            }}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
          >
            Upload Logos
          </button>
          <input
            ref={uploadStoresInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleUploadStoresCsv}
            disabled={uploadingStores}
          />
          <button
            type="button"
            onClick={() => uploadStoresInputRef.current?.click()}
            disabled={uploadingStores}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-400 transition-colors disabled:opacity-70"
          >
            {uploadingStores ? (uploadStoresProgress ?? "Uploading…") : "Upload Stores"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setIsEditing(false);
              setInitialEditName(null);
              setForm({ autoGenerateSlug: true, logoUploadMethod: "url", faqItems: [] });
              setShowCreateForm(true);
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
          >
            Create New Store
          </button>
          <button
            type="button"
            onClick={handleRemoveDuplicateStores}
            disabled={removingDuplicates}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 transition-colors disabled:opacity-70"
            title="Keep one store per name (prefer with logo), delete the rest"
          >
            {removingDuplicates ? "Removing…" : "Remove duplicate stores"}
          </button>
          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={bulkDeleting}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 transition-colors disabled:opacity-70 animate-pulse"
            >
              {bulkDeleting ? "Deleting…" : `Delete Selected (${selectedIds.size})`}
            </button>
          )}
          <button
            type="button"
            onClick={handleDeleteAll}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors"
          >
            Delete All Stores
          </button>
        </div>
      </div>

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
      <form id="logo-upload" onSubmit={handleSave} className="space-y-8">
        {/* Section: Store Details */}
        <div className="rounded-xl border-2 border-slate-200 bg-white p-6 shadow-sm">
          <h2 className={sectionTitle}>Store Details & Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>Store Name *</label>
              <input
                type="text"
                value={form.name ?? ""}
                onChange={(e) => setFormField("name", e.target.value)}
                className={inputClass}
                placeholder="Store Name (e.g., Nike)"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Sub Store Name (Displayed on store page)</label>
              <input
                type="text"
                value={form.subStoreName ?? ""}
                onChange={(e) => setFormField("subStoreName", e.target.value)}
                className={inputClass}
                placeholder="e.g., Nike Official Store"
              />
              <p className="mt-1 text-xs text-slate-500">
                This name will be displayed on the store page when visiting the store.
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Store Page Heading (above coupons)</label>
              <input
                type="text"
                value={form.storePageHeading ?? ""}
                onChange={(e) => setFormField("storePageHeading", e.target.value)}
                className={inputClass}
                placeholder="e.g., Valvoline Synthetic Oil Change Discount Code"
              />
              <p className="mt-1 text-xs text-slate-500">
                Main heading on the store page, above the coupon list. If blank, Sub Store Name + Discount Code is used.
              </p>
            </div>
            <div>
              <label className={labelClass}>Slug (URL-friendly name)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.autoGenerateSlug === false ? (form.slug ?? "") : slugify(form.name ?? "")}
                  onChange={(e) => {
                    setFormField("autoGenerateSlug", false);
                    setFormField("slug", e.target.value);
                  }}
                  className={inputClass}
                  placeholder="auto-generated"
                  readOnly={form.autoGenerateSlug !== false}
                />
                <label className="flex items-center gap-2 shrink-0 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.autoGenerateSlug !== false}
                    disabled={isEditing}
                    onChange={(e) => setFormField("autoGenerateSlug", e.target.checked)}
                  />
                  Auto-generate from name
                </label>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                URL will be: /stores/slug
                {isEditing ? " — edit slug directly when updating a store." : ""}
              </p>
            </div>
            <div>
              <label className={labelClass}>Logo Upload Method</label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="logoMethod"
                    checked={form.logoUploadMethod !== "upload"}
                    onChange={() => setFormField("logoUploadMethod", "url")}
                  />
                  URL / Extract from Website
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="logoMethod"
                    checked={form.logoUploadMethod === "upload"}
                    onChange={() => setFormField("logoUploadMethod", "upload")}
                  />
                  Upload File (Max 1 MB)
                </label>
              </div>
              {form.logoUploadMethod === "upload" ? (
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                    onChange={handleLogoFileChange}
                    disabled={logoUploading}
                    className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
                  />
                  {logoUploading && (
                    <p className="text-sm text-amber-600">Uploading…</p>
                  )}
                  {form.logoUrl && (
                    <p className="text-xs text-slate-500 truncate">Uploaded: {form.logoUrl}</p>
                  )}
                </div>
              ) : (
                <input
                  type="url"
                  value={form.logoUrl ?? ""}
                  onChange={(e) => setFormField("logoUrl", e.target.value)}
                  className={inputClass}
                  placeholder="Cloudinary URL, direct image URL, or website URL"
                />
              )}
            </div>
            <div>
              <label className={labelClass}>Logo Alt Text (Optional)</label>
              <input
                type="text"
                value={form.logoAltText ?? ""}
                onChange={(e) => setFormField("logoAltText", e.target.value)}
                className={inputClass}
                placeholder="Store logo"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Description (Optional)</label>
              <textarea
                value={form.description ?? ""}
                onChange={(e) => setFormField("description", e.target.value)}
                className={inputClass + " min-h-[80px]"}
                placeholder="Store Description"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Section: Technical & Affiliate */}
        <div className="rounded-xl border-2 border-slate-200 bg-white p-6 shadow-sm">
          <h2 className={sectionTitle}>Technical & Affiliate Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>Tracking URL</label>
              <input
                type="url"
                value={form.trackingUrl ?? ""}
                onChange={(e) => setFormField("trackingUrl", e.target.value)}
                className={inputClass}
                placeholder="https://example.com/tracking-url"
              />
              <p className="mt-1 text-xs text-slate-500">
                Tracking/affiliate URL for this store. Used for redirecting users to the store.
              </p>
            </div>
            <div>
              <label className={labelClass}>Country Codes</label>
              <input
                type="text"
                value={form.countryCodes ?? ""}
                onChange={(e) => setFormField("countryCodes", e.target.value)}
                className={inputClass}
                placeholder="US, GB, DE, FR (comma-separated)"
              />
            </div>
            <div>
              <label className={labelClass}>Store Website URL (Display)</label>
              <input
                type="url"
                value={form.storeWebsiteUrl ?? ""}
                onChange={(e) => setFormField("storeWebsiteUrl", e.target.value)}
                className={inputClass}
                placeholder="https://example.com"
              />
            </div>
          </div>
        </div>

        {/* Section: Category & Content */}
        <div className="rounded-xl border-2 border-slate-200 bg-white p-6 shadow-sm">
          <h2 className={sectionTitle}>Category & Content</h2>
          <div className="mb-4">
            <label className={labelClass}>Categories (multiple allowed)</label>
            <p className="mb-2 text-xs text-slate-500">Assign this store to one or more categories.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {STORE_CATEGORIES.map((cat) => (
                <label key={cat} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={(form.categories ?? []).includes(cat)}
                    onChange={() => toggleCategory(cat)}
                  />
                  {cat}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Why Trust Us Section (Optional)</label>
              <textarea
                value={form.whyTrustUs ?? ""}
                onChange={(e) => setFormField("whyTrustUs", e.target.value)}
                className={inputClass + " min-h-[60px]"}
                placeholder="Why should customers trust this store?"
                rows={2}
              />
            </div>
            <div>
              <label className={labelClass}>More Information Section (Optional)</label>
              <textarea
                value={form.moreInformation ?? ""}
                onChange={(e) => setFormField("moreInformation", e.target.value)}
                className={inputClass + " min-h-[80px]"}
                placeholder="Enter detailed information about the store, coupons, how to use them. You can use HTML tags."
                rows={3}
              />
            </div>
            <div>
              <label className={labelClass}>Sidebar: [Store name] Codes and Coupons (Optional)</label>
              <textarea
                value={form.sidebarContent ?? ""}
                onChange={(e) => setFormField("sidebarContent", e.target.value)}
                className={inputClass + " min-h-[80px]"}
                placeholder="Sidebar content. Supports HTML."
                rows={3}
              />
            </div>
            <div>
              <label className={labelClass}>More About [store name] (Optional)</label>
              <textarea
                value={form.moreAboutStore ?? ""}
                onChange={(e) => setFormField("moreAboutStore", e.target.value)}
                className={inputClass + " min-h-[80px]"}
                placeholder="More about the store. Supports HTML."
                rows={3}
              />
            </div>
            <div>
              <label className={labelClass}>Shopping Tips Section - Title (Optional)</label>
              <input
                type="text"
                value={form.shoppingTipsTitle ?? ""}
                onChange={(e) => setFormField("shoppingTipsTitle", e.target.value)}
                className={inputClass}
                placeholder="e.g. Touchtunes Coupon Code Shopping Tips"
              />
            </div>
            <div>
              <label className={labelClass}>Shopping Tips - Bullet points (Optional)</label>
              <textarea
                value={form.shoppingTipsBulletsText ?? (form.shoppingTipsBullets ?? []).join("\n")}
                onChange={(e) => setFormField("shoppingTipsBulletsText", e.target.value)}
                className={inputClass + " min-h-[60px]"}
                placeholder="One tip per line"
                rows={3}
              />
            </div>
            <div>
              <label className={labelClass}>FAQs (shown on store page)</label>
              <p className="mb-2 text-xs text-slate-500">Add question/answer pairs.</p>
              {(form.faqItems ?? []).map((faq, i) => (
                <div key={i} className="mb-3 p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => updateFaq(i, "question", e.target.value)}
                    className={inputClass + " mb-2"}
                    placeholder="Question"
                  />
                  <textarea
                    value={faq.answer}
                    onChange={(e) => updateFaq(i, "answer", e.target.value)}
                    className={inputClass + " min-h-[60px]"}
                    placeholder="Answer"
                    rows={2}
                  />
                  <button
                    type="button"
                    onClick={() => removeFaq(i)}
                    className="mt-2 text-sm text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addFaq}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Add FAQ
              </button>
            </div>
          </div>
        </div>

        {/* Section: SEO */}
        <div className="rounded-xl border-2 border-slate-200 bg-white p-6 shadow-sm">
          <h2 className={sectionTitle}>SEO Page Title & Meta Description</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>SEO Page Title (Optional)</label>
              <input
                type="text"
                value={form.seoPageTitle ?? ""}
                onChange={(e) => setFormField("seoPageTitle", e.target.value)}
                className={inputClass}
                placeholder="{store_name} Coupons & Deals {month_year} - Save"
                maxLength={100}
              />
              <p className="mt-1 text-xs text-slate-500">Max 100 characters. Placeholders: {"{store_name}"}, {"{month_year}"}, {"{active_coupons}"}</p>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>SEO Meta Description (Optional)</label>
              <textarea
                value={form.seoMetaDescription ?? ""}
                onChange={(e) => setFormField("seoMetaDescription", e.target.value)}
                className={inputClass}
                placeholder="Get the latest coupons & save!"
                maxLength={160}
                rows={2}
              />
              <p className="mt-1 text-xs text-slate-500">Max 160 characters.</p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="rounded-xl border-2 border-slate-200 bg-white p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.markAsTrending ?? false}
              onChange={(e) => setFormField("markAsTrending", e.target.checked)}
            />
            Mark as Trending
          </label>
          <div className="flex gap-3">
            {editingStoreId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border-2 border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : editingStoreId ? "Update Store" : "Create Store"}
            </button>
          </div>
        </div>
      </form>
      )}

      {/* Stores table – reference layout */}
      <div className="rounded-xl border-2 border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
            <p className="mt-3 text-sm text-slate-500">Loading…</p>
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            No stores yet. Click &quot;Create New Store&quot; to add one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={filteredStores.length > 0 && selectedIds.size === filteredStores.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 cursor-pointer"
                      title="Select all"
                    />
                  </th>
                  <th className="text-left font-semibold text-slate-700 px-4 py-3">Store ID</th>
                  <th className="text-left font-semibold text-slate-700 px-4 py-3">Logo</th>
                  <th className="text-left font-semibold text-slate-700 px-4 py-3">Store Name</th>
                  <th className="text-left font-semibold text-slate-700 px-4 py-3">Slug</th>
                  <th className="text-left font-semibold text-slate-700 px-4 py-3">Country</th>
                  <th className="text-left font-semibold text-slate-700 px-4 py-3">Category</th>
                  <th className="text-left font-semibold text-slate-700 px-4 py-3">Tracking Link</th>
                  <th className="text-left font-semibold text-slate-700 px-4 py-3">Coupons</th>
                  <th className="text-left font-semibold text-slate-700 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStores.map((s, i) => {
                  const counts = couponCountByStore[s.name ?? ""] ?? { total: 0, active: 0, inactive: 0 };
                  const country = (s.countryCodes ?? "").split(",")[0]?.trim() || "–";
                  const category = (s.categories ?? [])[0] ?? "–";
                  return (
                    <tr
                      key={s.id}
                      className={`border-b border-slate-100 hover:bg-slate-50/50 ${
                        i % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(s.id)}
                          onChange={() => toggleSelect(s.id)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-slate-700">{i + 1}</td>
                      <td className="px-4 py-2">
                        {s.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.logoUrl} alt="" className="h-8 w-8 object-contain rounded" />
                        ) : (
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded bg-slate-200 text-xs font-medium text-slate-500">
                            {s.name?.charAt(0) ?? "?"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{s.name ?? "–"}</td>
                      <td className="px-4 py-3 text-slate-600">{s.slug ?? "–"}</td>
                      <td className="px-4 py-3 text-slate-600">{country}</td>
                      <td className="px-4 py-3 text-slate-600 max-w-[140px] truncate" title={category}>{category}</td>
                      <td className="px-4 py-3 max-w-[160px]">
                        {s.trackingUrl || s.storeWebsiteUrl ? (
                          <a
                            href={s.trackingUrl || s.storeWebsiteUrl || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate block"
                          >
                            {(s.trackingUrl || s.storeWebsiteUrl || "").replace(/^https?:\/\//, "").slice(0, 24)}…
                          </a>
                        ) : (
                          "–"
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div className="text-xs leading-relaxed">
                          Total: {counts.total}, Active: {counts.active}, Inactive: {counts.inactive}
                        </div>
                        <button
                          type="button"
                          onClick={() => openCouponsModal(s)}
                          className="mt-1.5 rounded-md bg-violet-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-violet-500 transition-colors"
                        >
                          View coupons
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(s)}
                            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(s.id)}
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
        )}
      </div>

      {/* Store coupons modal */}
      {couponsModalStore && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="store-coupons-title"
          onClick={closeCouponsModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 id="store-coupons-title" className="text-lg font-bold text-slate-900">
                  Coupons — {couponsModalStore.name ?? "Store"}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {modalCouponOrder.length} coupon{modalCouponOrder.length !== 1 ? "s" : ""} ·{" "}
                  {modalCouponOrder.filter((c) => c.status !== "disable").length} active ·{" "}
                  {modalCouponOrder.filter((c) => c.status === "disable").length} inactive
                </p>
                <p className="mt-1 text-xs text-violet-700">
                  Drag rows to set display order (priority). Top = shown first on store page.
                  {savingCouponOrder && <span className="ml-2 text-slate-500">Saving…</span>}
                </p>
              </div>
              <button
                type="button"
                onClick={closeCouponsModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4">
              {modalCouponOrder.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No coupons for this store.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left">
                      <th className="pb-2 pr-2 w-8 font-semibold text-slate-700" aria-label="Drag" />
                      <th className="pb-2 pr-3 font-semibold text-slate-700">#</th>
                      <th className="pb-2 pr-3 font-semibold text-slate-700">Title</th>
                      <th className="pb-2 pr-3 font-semibold text-slate-700">Code</th>
                      <th className="pb-2 pr-3 font-semibold text-slate-700">Status</th>
                      <th className="pb-2 font-semibold text-slate-700">Expiry</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalCouponOrder.map((c, idx) => (
                      <tr
                        key={c.id}
                        draggable={!savingCouponOrder}
                        onDragStart={() => setDragCouponId(c.id)}
                        onDragEnd={() => {
                          setDragCouponId(null);
                          setDragOverIndex(null);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverIndex(idx);
                        }}
                        onDragLeave={() => setDragOverIndex((i) => (i === idx ? null : i))}
                        onDrop={(e) => {
                          e.preventDefault();
                          void handleCouponDrop(idx);
                        }}
                        className={`border-b border-slate-100 last:border-0 transition-colors ${
                          dragCouponId === c.id ? "opacity-40 bg-slate-50" : ""
                        } ${dragOverIndex === idx && dragCouponId !== c.id ? "bg-violet-50 ring-1 ring-violet-200" : ""} ${
                          savingCouponOrder ? "pointer-events-none" : ""
                        }`}
                      >
                        <td className="py-2.5 pr-2 text-slate-400 cursor-grab active:cursor-grabbing">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                            <path d="M7 4a1 1 0 11-2 0 1 1 0 012 0zm6 0a1 1 0 11-2 0 1 1 0 012 0zM7 10a1 1 0 11-2 0 1 1 0 012 0zm6 0a1 1 0 11-2 0 1 1 0 012 0zM7 16a1 1 0 11-2 0 1 1 0 012 0zm6 0a1 1 0 11-2 0 1 1 0 012 0z" />
                          </svg>
                        </td>
                        <td className="py-2.5 pr-3 text-slate-500 font-mono text-xs">{idx + 1}</td>
                        <td className="py-2.5 pr-3 text-slate-900 max-w-[200px]">
                          <span className="line-clamp-2" title={c.couponTitle ?? ""}>
                            {c.couponTitle?.trim() || "–"}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 font-medium text-slate-800">
                          {c.couponCode?.trim() || "–"}
                        </td>
                        <td className="py-2.5 pr-3">
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                              c.status === "disable"
                                ? "bg-slate-200 text-slate-600"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {c.status === "disable" ? "Inactive" : "Active"}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-600 whitespace-nowrap">
                          {c.expiry?.trim() || "–"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="border-t border-slate-200 px-5 py-3 flex justify-end gap-2 shrink-0">
              <Link
                href={`/admin/coupons?store=${encodeURIComponent(couponsModalStore.name ?? "")}`}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 inline-block"
              >
                Open Coupons admin
              </Link>
              <button
                type="button"
                onClick={closeCouponsModal}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
