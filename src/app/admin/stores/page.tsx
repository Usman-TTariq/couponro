"use client";

import { useEffect, useRef, useState } from "react";
import type { Store } from "@/types/store";
import { STORE_CATEGORIES } from "@/lib/store-categories";
import { slugify } from "@/lib/slugify";
import { parseCSV } from "@/lib/parse-csv";

const inputClass =
  "w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-500 focus:border-slate-500 focus:ring-2 focus:ring-slate-400/30 outline-none transition-colors text-sm";
const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";
const sectionTitle = "text-sm font-bold text-slate-800 uppercase tracking-wide mb-3";

type FormState = Partial<Store> & {
  shoppingTipsBulletsText?: string;
  faqItems?: { question: string; answer: string }[];
};

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
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [coupons, setCoupons] = useState<Store[]>([]);
  const [uploadingStores, setUploadingStores] = useState(false);
  const [uploadStoresProgress, setUploadStoresProgress] = useState<string | null>(null);
  const uploadStoresInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [storesRes, couponsRes] = await Promise.all([
        fetch("/api/stores", { cache: "no-store" }),
        fetch("/api/coupons", { cache: "no-store" }),
      ]);
      const storesData = await storesRes.json();
      const couponsData = await couponsRes.json().catch(() => []);
      setStores(Array.isArray(storesData) ? storesData : []);
      setCoupons(Array.isArray(couponsData) ? couponsData : []);
    } catch {
      setMessage({ type: "err", text: "Failed to load stores" });
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
    setShowCreateForm(false);
    setLogoFile(null);
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
    let ok = 0;
    let fail = 0;
    for (let i = 0; i < rows.length; i++) {
      setUploadStoresProgress(`Uploading ${i + 1} of ${rows.length}…`);
      const r = rows[i];
      const name = (r["Store Name"] ?? r["store name"] ?? "").trim();
      if (!name) continue;
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
        const res = await fetch("/api/stores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) ok++;
        else fail++;
      } catch {
        fail++;
      }
    }
    setUploadingStores(false);
    setUploadStoresProgress(null);
    e.target.value = "";
    if (ok > 0) {
      load();
      showMsg("ok", `Uploaded ${ok} store(s).${fail > 0 ? ` ${fail} failed.` : ""}`);
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
        form.autoGenerateSlug !== false
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
        id: editingId ?? undefined,
        name,
        slug,
        autoGenerateSlug: form.autoGenerateSlug ?? true,
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

      if (editingId) {
        const res = await fetch("/api/stores", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error((d?.error as string) ?? "Update failed");
        }
        showMsg("ok", "Store updated");
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
    setShowCreateForm(true);
    setForm({
      id: s.id,
      name: s.name,
      slug: s.slug,
      autoGenerateSlug: !!s.slug ? false : true,
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
    setEditingId(s.id);
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

  const showForm = showCreateForm || !!editingId;

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
              setForm({ autoGenerateSlug: true, logoUploadMethod: "url", faqItems: [] });
              setShowCreateForm(true);
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
          >
            Create New Store
          </button>
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
                    onChange={(e) => setFormField("autoGenerateSlug", e.target.checked)}
                  />
                  Auto-generate from name
                </label>
              </div>
              <p className="mt-1 text-xs text-slate-500">URL will be: /stores/slug or /promotions/slug</p>
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
            {editingId && (
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
              {saving ? "Saving…" : editingId ? "Update Store" : "Create Store"}
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
                        Total: {counts.total}, Active: {counts.active}, Inactive: {counts.inactive}
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
    </div>
  );
}
