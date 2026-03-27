import type { MetadataRoute } from "next";
import { getStores, getCoupons } from "@/lib/stores";
import { slugify } from "@/lib/slugify";
import { getAllSlugs } from "@/lib/blog-posts";
import { getSanityPostSlugs } from "@/lib/sanity.blog";
import { getCouponDetailPath } from "@/lib/coupon-slug";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://seempromo.com";
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
    { url: `${baseUrl}/freeshipping`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/promotions`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ];
  entries.push(...staticPages);

  // --- Dynamic: blog post pages (Sanity + static) ---
  let blogSlugs: string[] = [];
  try {
    const sanitySlugs = await getSanityPostSlugs();
    blogSlugs = [...new Set([...sanitySlugs, ...getAllSlugs()])];
  } catch {
    blogSlugs = getAllSlugs();
  }
  for (const slug of blogSlugs) {
    entries.push({
      url: `${baseUrl}/blog/${encodeURIComponent(slug)}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  // --- Dynamic: store pages (HTML) ---
  try {
    const stores = await getStores();
    const enabledStores = stores.filter((s) => (s.status ?? "enable") !== "disable");
    for (const s of enabledStores) {
      const slug = s.slug || slugify(s.name || "");
      if (!slug) continue;
      entries.push({
        url: `${baseUrl}/stores/${encodeURIComponent(slug)}`,
        lastModified: s.createdAt ? new Date(s.createdAt) : new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch {
    // Supabase not configured
  }

  // --- Dynamic: coupon pages (HTML – /coupon/[store]/[title]) ---
  try {
    const coupons = await getCoupons();
    const enabledCoupons = coupons.filter((c) => (c.status ?? "enable") !== "disable");
    for (const c of enabledCoupons) {
      const path = getCouponDetailPath(c);
      if (!path.startsWith("/coupon/")) continue;
      entries.push({
        url: `${baseUrl}${path}`,
        lastModified: c.createdAt ? new Date(c.createdAt) : new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch {
    // Supabase not configured
  }

  return entries;
}
