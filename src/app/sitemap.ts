import type { MetadataRoute } from "next";
import { getStores, getCoupons } from "@/lib/stores";
import { slugify } from "@/lib/slugify";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://couponro.com";
const baseUrl = BASE.replace(/\/$/, "");

/**
 * Dynamic sitemap – sirf HTML/content pages (no API, no admin).
 * Includes: static pages + all store pages + all coupon pages.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // --- Static HTML pages ---
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/coupons`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/stores`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/cashback`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/promotions`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ];
  entries.push(...staticPages);

  // --- Dynamic: store pages (HTML) ---
  try {
    const stores = await getStores();
    const enabledStores = stores.filter((s) => (s.status ?? "enable") !== "disable");
    for (const s of enabledStores) {
      const slug = s.slug || slugify(s.name || "");
      if (!slug) continue;
      entries.push({
        url: `${baseUrl}/stores/${encodeURIComponent(slug)}`,
        lastModified: s.updatedAt || s.createdAt ? new Date(s.updatedAt || s.createdAt || 0) : new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch {
    // Supabase not configured
  }

  // --- Dynamic: coupon pages (HTML – /coupon/[id]) ---
  try {
    const coupons = await getCoupons();
    const enabledCoupons = coupons.filter((c) => (c.status ?? "enable") !== "disable");
    for (const c of enabledCoupons) {
      const id = (c.id ?? "").trim();
      if (!id) continue;
      entries.push({
        url: `${baseUrl}/coupon/${encodeURIComponent(id)}`,
        lastModified: c.updatedAt || c.createdAt ? new Date(c.updatedAt || c.createdAt || 0) : new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch {
    // Supabase not configured
  }

  return entries;
}
