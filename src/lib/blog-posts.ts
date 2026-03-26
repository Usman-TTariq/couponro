import { getStoreBlogSlugs, getStoreBlogContent } from "./store-blog-content";

export type BlogPostMeta = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  date: string;
  category: string;
  featuredImage: string | null;
};

/** Default blog post URL – use this when "Blog" link should open the main post directly (not listing). */
export const DEFAULT_BLOG_POST_SLUG = "seempromo-saving-tips-coupon-codes-guide-2026";
export const DEFAULT_BLOG_POST_URL = `/blog/${DEFAULT_BLOG_POST_SLUG}`;

/** Blog URLs for home page Stores and Coupons cards. */
export const STORES_BLOG_POST_SLUG = "stores-coupon-deals-guide-2026";
export const STORES_BLOG_POST_URL = `/blog/${STORES_BLOG_POST_SLUG}`;
export const COUPONS_BLOG_POST_URL = DEFAULT_BLOG_POST_URL;

/** Free Shipping and Deals banners on home – dedicated blog posts. */
export const FREE_SHIPPING_BLOG_POST_SLUG = "free-shipping-deals-guide-2026";
export const FREE_SHIPPING_BLOG_POST_URL = `/blog/${FREE_SHIPPING_BLOG_POST_SLUG}`;
export const DEALS_BLOG_POST_SLUG = "top-deals-coupons-guide-2026";
export const DEALS_BLOG_POST_URL = `/blog/${DEALS_BLOG_POST_SLUG}`;

/** Footer Instagram-style tiles (6) – each tile links to its own blog post. */
export const FOOTER_TILE_SLUGS = [
  "fresh-finds-saving-tips-2026",
  "seasonal-savings-guide-2026",
  "kitchen-coffee-deals-2026",
  "travel-getaway-deals-2026",
  "home-garden-savings-2026",
  "fashion-outdoor-deals-2026",
] as const;
export const FOOTER_TILE_BLOG_URLS = FOOTER_TILE_SLUGS.map((s) => `/blog/${s}`);
export const FOOTER_TILE_TITLES = [
  "Fresh Finds",
  "Seasonal Savings",
  "Kitchen Deals",
  "Travel Deals",
  "Home & Garden",
  "Fashion & Outdoor",
] as const;

/** All blog categories (for filtering and display). */
export const BLOG_CATEGORIES = [
  "Saving Tips",
  "Store Guides",
  "Deals",
  "Free Shipping",
  "Tech & Electronics",
  "Fashion & Beauty",
  "Home & Garden",
] as const;

const FEATURED_IMG = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80";

function storePost(
  slug: string,
  storeName: string,
  category: string,
  date: string
): BlogPostMeta {
  return {
    slug,
    title: `${storeName} Coupon Codes, Deals & Discounts (Complete Guide 2026)`,
    metaTitle: `Complete Savings Guide via ${storeName} Coupon Codes in 2026`,
    metaDescription: `Discover the latest ${storeName} coupon codes, verified ${storeName} discount codes, and special offers to save big in 2026.`,
    excerpt: `Unlock exclusive savings and verified ${storeName} coupon codes. Our guide helps you save on your next ${storeName} order with working promo codes and deals.`,
    date,
    category,
    featuredImage: FEATURED_IMG,
  };
}

const STORE_CATEGORIES: Record<string, string> = {
  "touchtunes-coupon-codes-deals-discounts-2026": "Saving Tips",
  "amazon-coupon-codes-2026": "Saving Tips",
  "walmart-coupon-codes-deals-2026": "Saving Tips",
  "target-coupon-codes-deals-2026": "Saving Tips",
  "ebay-coupon-codes-2026": "Deals",
  "etsy-coupon-codes-2026": "Deals",
  "best-buy-coupon-codes-2026": "Tech & Electronics",
  "nike-coupon-codes-2026": "Fashion & Beauty",
  "adidas-coupon-codes-2026": "Fashion & Beauty",
  "home-depot-coupon-codes-2026": "Home & Garden",
  "lowes-coupon-codes-2026": "Home & Garden",
  "macys-coupon-codes-2026": "Store Guides",
  "kohls-coupon-codes-2026": "Store Guides",
  "nordstrom-coupon-codes-2026": "Store Guides",
  "sephora-coupon-codes-2026": "Fashion & Beauty",
  "ulta-coupon-codes-2026": "Fashion & Beauty",
  "wayfair-coupon-codes-2026": "Home & Garden",
  "overstock-coupon-codes-2026": "Free Shipping",
  "newegg-coupon-codes-2026": "Tech & Electronics",
  "dell-coupon-codes-2026": "Tech & Electronics",
  "hp-coupon-codes-2026": "Tech & Electronics",
  "samsung-coupon-codes-2026": "Tech & Electronics",
  "gap-coupon-codes-2026": "Fashion & Beauty",
  "old-navy-coupon-codes-2026": "Fashion & Beauty",
  "shein-coupon-codes-2026": "Deals",
  "asos-coupon-codes-2026": "Deals",
  "zappos-coupon-codes-2026": "Free Shipping",
  "chewy-coupon-codes-2026": "Free Shipping",
  "petco-coupon-codes-2026": "Free Shipping",
  "staples-coupon-codes-2026": "Tech & Electronics",
  "bed-bath-beyond-coupon-codes-2026": "Home & Garden",
  "nordstrom-rack-coupon-codes-2026": "Deals",
  "costco-coupon-codes-2026": "Store Guides",
  "apple-store-coupon-codes-2026": "Tech & Electronics",
};

const POSTS: BlogPostMeta[] = [
  {
    slug: "stores-coupon-deals-guide-2026",
    title: "Best Stores for Coupons & Deals (Complete Guide 2026)",
    metaTitle: "Best Stores for Coupons & Deals – Complete Guide 2026",
    metaDescription:
      "Discover the best stores for coupon codes and deals in 2026. Shop smart with verified promo codes from top retailers.",
    excerpt:
      "Find where to shop for the best coupon codes and deals—by category, store, and tips to save more in 2026.",
    date: "2026-03-04",
    category: "Store Guides",
    featuredImage: "/img05.jpg",
  },
  {
    slug: "seempromo-saving-tips-coupon-codes-guide-2026",
    title: "How to Save More with Coupon Codes & Deals (Complete Guide 2026)",
    metaTitle: "How to Save More with Coupon Codes & Deals – Complete Guide 2026",
    metaDescription:
      "Learn how to find working coupon codes, stack discounts, and save more when you shop. Verified tips and store guides for 2026.",
    excerpt:
      "Unlock savings with verified coupon codes and deals. Our guide shows you how to pay less online—no fake or expired codes, just working offers.",
    date: "2026-03-06",
    category: "Saving Tips",
    featuredImage: FEATURED_IMG,
  },
  {
    slug: "free-shipping-deals-guide-2026",
    title: "Free Shipping Deals & How to Get Free Delivery (Guide 2026)",
    metaTitle: "Free Shipping Deals – How to Get Free Delivery in 2026",
    metaDescription:
      "Find stores and tips for free shipping in 2026. Get free delivery on orders with verified promo codes and thresholds.",
    excerpt:
      "Save on delivery with free shipping offers from top stores. See minimum order tips and codes that waive shipping fees.",
    date: "2026-03-04",
    category: "Free Shipping",
    featuredImage: "/img10.jpg",
  },
  {
    slug: "top-deals-coupons-guide-2026",
    title: "Top Deals & Coupon Codes (Best Offers Guide 2026)",
    metaTitle: "Top Deals & Coupon Codes – Best Offers Guide 2026",
    metaDescription:
      "Discover the best deals and working coupon codes in 2026. Verified promo codes and seasonal offers from top retailers.",
    excerpt:
      "Get the latest deals and coupon codes in one place. Verified offers so you pay less at checkout.",
    date: "2026-03-04",
    category: "Deals",
    featuredImage: "/img07.jpg",
  },
  {
    slug: "fresh-finds-saving-tips-2026",
    title: "Fresh Finds & Saving Tips (Guide 2026)",
    metaTitle: "Fresh Finds & Saving Tips – SeemPromo Guide 2026",
    metaDescription: "Save on fresh finds and everyday essentials with verified coupon codes and deals in 2026.",
    excerpt: "Get the best deals on groceries and fresh finds. Verified codes and tips to save more.",
    date: "2026-03-04",
    category: "Saving Tips",
    featuredImage: "/img13.jpg",
  },
  {
    slug: "seasonal-savings-guide-2026",
    title: "Seasonal Savings Guide (Best Deals 2026)",
    metaTitle: "Seasonal Savings Guide – Best Deals 2026",
    metaDescription: "Capture seasonal sales and limited-time offers. Verified coupon codes for every season in 2026.",
    excerpt: "Plan your shopping around seasonal sales. Working codes and deals for 2026.",
    date: "2026-03-04",
    category: "Deals",
    featuredImage: "/img14.jpg",
  },
  {
    slug: "kitchen-coffee-deals-2026",
    title: "Kitchen & Coffee Deals (Savings Guide 2026)",
    metaTitle: "Kitchen & Coffee Deals – Savings Guide 2026",
    metaDescription: "Save on kitchen essentials and coffee with verified promo codes and deals in 2026.",
    excerpt: "Coupon codes for kitchen gear and coffee. Verified offers so you pay less.",
    date: "2026-03-04",
    category: "Home & Garden",
    featuredImage: "/img15.jpg",
  },
  {
    slug: "travel-getaway-deals-2026",
    title: "Travel & Getaway Deals (Guide 2026)",
    metaTitle: "Travel & Getaway Deals – SeemPromo Guide 2026",
    metaDescription: "Find travel and getaway deals with verified coupon codes. Save on gear and bookings in 2026.",
    excerpt: "Deals for travel and outdoor getaways. Working codes for gear and more.",
    date: "2026-03-04",
    category: "Deals",
    featuredImage: "/img16.jpg",
  },
  {
    slug: "home-garden-savings-2026",
    title: "Home & Garden Savings (Complete Guide 2026)",
    metaTitle: "Home & Garden Savings – Complete Guide 2026",
    metaDescription: "Save on home and garden with verified coupon codes and deals. Top retailers and tips for 2026.",
    excerpt: "Coupon codes for home and garden. Verified deals to spruce up your space for less.",
    date: "2026-03-04",
    category: "Home & Garden",
    featuredImage: "/img17.jpg",
  },
  {
    slug: "fashion-outdoor-deals-2026",
    title: "Fashion & Outdoor Deals (Guide 2026)",
    metaTitle: "Fashion & Outdoor Deals – SeemPromo Guide 2026",
    metaDescription: "Save on fashion and outdoor gear with verified coupon codes and deals in 2026.",
    excerpt: "Deals on fashion and outdoor apparel. Working codes from top brands.",
    date: "2026-03-04",
    category: "Fashion & Beauty",
    featuredImage: "/img18.jpg",
  },
  {
    slug: "touchtunes-coupon-codes-deals-discounts-2026",
    title: "TouchTunes Coupon Codes, Deals & Discounts (Complete Savings Guide 2026)",
    metaTitle: "Complete Savings Guide via TouchTunes Coupon Codes in 2026.",
    metaDescription:
      "Discover the latest TouchTunes coupon codes, verified TouchTunes discount codes, and special offers for jukebox credits to save big in 2026.",
    excerpt:
      "Unlock exclusive savings, free credits, and special promotional offers via credible TouchTunes coupon codes for your favorite jukebox songs. No catch—verified deals that work.",
    date: "2026-03-06",
    category: "Saving Tips",
    featuredImage: FEATURED_IMG,
  },
  ...getStoreBlogSlugs().map((slug, i) => {
    const content = getStoreBlogContent(slug);
    const storeName = content?.storeName ?? slug.replace(/-coupon-codes-2026$/, "").replace(/-/g, " ");
    const category = STORE_CATEGORIES[slug] || "Store Guides";
    const date = new Date(2026, 2, 6 - Math.floor(i / 5));
    return storePost(slug, storeName, category, date.toISOString().slice(0, 10));
  }),
];

export function getPosts(): BlogPostMeta[] {
  return [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
}

export function getPostsByCategory(category: string): BlogPostMeta[] {
  return getPosts().filter((p) => p.category === category);
}

export function getPostBySlug(slug: string): BlogPostMeta | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return POSTS.map((p) => p.slug);
}

/** Normalize store slug (e.g. from /stores/amazon) for matching. */
function normalizeStoreSlug(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

/** Map from store URL slug to blog post slug. Built from store blog slugs. */
const STORE_SLUG_TO_BLOG_SLUG: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const blogSlug of getStoreBlogSlugs()) {
    const base = blogSlug
      .replace(/-coupon-codes-deals-2026$/, "")
      .replace(/-coupon-codes-2026$/, "");
    out[base] = blogSlug;
    out[base.replace(/-/g, "")] = blogSlug;
  }
  return out;
})();

/**
 * Return the blog post slug for a store (by store page slug), or null if none.
 * Use this to link from store pages to their guide without redirecting the store page.
 */
export function getBlogSlugForStore(storeSlug: string): string | null {
  if (!storeSlug?.trim()) return null;
  const normalized = normalizeStoreSlug(storeSlug);
  if (getStoreBlogContent(normalized)) return normalized;
  return STORE_SLUG_TO_BLOG_SLUG[normalized] ?? STORE_SLUG_TO_BLOG_SLUG[normalized.replace(/-/g, "")] ?? null;
}
