import Link from "next/link";
import type { Metadata } from "next";
import { getStores, getCoupons, slugify } from "@/lib/stores";
import { getBlogSlugForStore } from "@/lib/blog-posts";
import type { Store } from "@/types/store";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StorePageContent from "@/components/StorePageContent";

export const dynamic = "force-dynamic";

function normalizeSlug(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function replaceSeoPlaceholders(
  text: string,
  opts: { storeName: string; activeCoupons: number }
): string {
  const now = new Date();
  const monthYear = `${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}`;
  return text
    .replace(/\{store_name\}/gi, opts.storeName)
    .replace(/\{active_coupons\}/gi, String(opts.activeCoupons))
    .replace(/\{month_year\}/gi, monthYear);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { store, storeCoupons, displayName } = await getStoreData(slug);
  const activeCoupons = storeCoupons.length;
  const replacer = (s: string) =>
    replaceSeoPlaceholders(s, { storeName: displayName, activeCoupons });

  const title =
    store?.seoPageTitle?.trim()
      ? replacer(store.seoPageTitle.trim()).slice(0, 100)
      : `${displayName} Coupons & Deals`;
  const description =
    store?.seoMetaDescription?.trim()
      ? replacer(store.seoMetaDescription.trim()).slice(0, 160)
      : store?.description ||
        storeCoupons[0]?.description ||
        `Find the latest ${displayName} coupon codes, promo codes, and deals. Save with SeemPromo.`;

  return {
    title,
    description,
  };
}

async function getStoreData(slug: string): Promise<{
  store: Store | null;
  storeCoupons: Store[];
  displayName: string;
  otherStores: Store[];
}> {
  const raw = slug.toLowerCase().trim();
  const [stores, coupons] = await Promise.all([getStores(), getCoupons()]);
  const enabledStores = stores.filter((s) => s.status !== "disable");
  const store = enabledStores.find(
    (s) =>
      (s.slug || slugify(s.name)).toLowerCase() === raw ||
      normalizeSlug(s.slug || s.name) === normalizeSlug(raw)
  );
  const storeNameKey = (store?.name ?? "").trim().toLowerCase();
  const storeCoupons = coupons.filter((c) => {
    if (c.status === "disable") return false;
    const slugMatch =
      (c.slug || slugify(c.name)).toLowerCase() === raw ||
      (c.name && normalizeSlug(c.name) === normalizeSlug(raw));
    if (slugMatch) return true;
    if (storeNameKey && (c.name ?? "").trim().toLowerCase() === storeNameKey) return true;
    return false;
  });
  const displayName = store?.name ?? storeCoupons[0]?.name ?? "Store";
  const otherStores = enabledStores.filter((s) => s.id !== store?.id).slice(0, 6);
  return { store: store ?? null, storeCoupons, displayName, otherStores };
}

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ popup?: string; copy?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const { store, storeCoupons, displayName, otherStores } = await getStoreData(slug);
  const relatedBlogSlug = getBlogSlugForStore(slug);

  if (!store && storeCoupons.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 mx-auto max-w-4xl px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Not found</h1>
          <p className="mt-2 text-gray-600">This store or coupon page does not exist.</p>
          <Link href="/" className="mt-4 inline-block text-[#34C759] font-medium hover:underline">
            ← Back to home
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <StorePageContent
        store={store}
        storeCoupons={storeCoupons}
        displayName={displayName}
        otherStores={otherStores}
        slug={slug}
        initialPopupId={sp?.popup ?? undefined}
        relatedBlogSlug={relatedBlogSlug ?? undefined}
      />
      <Footer />
    </div>
  );
}
