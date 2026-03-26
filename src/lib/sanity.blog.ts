import { sanityClient, sanityImageUrl } from "./sanity";
import {
  POSTS_LIST_QUERY,
  POST_BY_SLUG_QUERY,
  POST_SLUGS_QUERY,
  latestPostsQuery,
} from "./sanity.queries";
import type { SanityPostListing, SanityPostFull, SanityPostNormalized } from "@/types/sanity";

function normalizeListing(post: SanityPostListing | null): SanityPostNormalized | null {
  if (!post || !post.slug?.current) return null;
  const categoryTitle = post.category?.title ?? "Blog";
  const date = post.publishedAt
    ? new Date(post.publishedAt).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  return {
    slug: post.slug.current,
    title: post.title ?? "Untitled",
    metaTitle: (post.metaTitle?.trim() || post.title) ?? "Untitled",
    metaDescription: post.metaDescription?.trim() || post.excerpt?.trim() || "",
    excerpt: post.excerpt?.trim() || "",
    date,
    category: categoryTitle,
    featuredImage: sanityImageUrl(post.mainImage) ?? null,
    author: post.author?.trim() || "Couponro",
  };
}

export async function getSanityPosts(): Promise<SanityPostNormalized[]> {
  const raw = await sanityClient.fetch<SanityPostListing[]>(POSTS_LIST_QUERY);
  const list = (Array.isArray(raw) ? raw : []).map(normalizeListing).filter(Boolean) as SanityPostNormalized[];
  return list;
}

export async function getSanityPostBySlug(slug: string): Promise<{
  normalized: SanityPostNormalized;
  body: unknown[] | null;
  ogImageUrl: string | null;
} | null> {
  const raw = await sanityClient.fetch<SanityPostFull | null>(POST_BY_SLUG_QUERY, { slug });
  if (!raw || !raw.slug?.current) return null;
  const normalized = normalizeListing(raw as SanityPostListing);
  if (!normalized) return null;
  return {
    normalized,
    body: Array.isArray(raw.body) ? raw.body : null,
    ogImageUrl: sanityImageUrl(raw.ogImage ?? raw.mainImage) ?? null,
  };
}

export async function getSanityPostSlugs(): Promise<string[]> {
  const raw = await sanityClient.fetch<{ slug: string }[]>(POST_SLUGS_QUERY);
  return (Array.isArray(raw) ? raw : []).map((r) => r.slug).filter(Boolean);
}

export async function getLatestSanityPosts(limit: number): Promise<SanityPostNormalized[]> {
  const raw = await sanityClient.fetch<SanityPostListing[]>(latestPostsQuery(limit));
  return (Array.isArray(raw) ? raw : []).map(normalizeListing).filter(Boolean) as SanityPostNormalized[];
}
