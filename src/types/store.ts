export type Store = {
  id: string;
  name: string;
  logoUrl: string;
  description: string;
  expiry: string;
  link?: string;
  createdAt?: string;
  slug?: string;
  category?: string;
  categories?: string[];
  status?: "enable" | "disable";

  // Create Store form – Store Details
  subStoreName?: string;
  storePageHeading?: string;
  autoGenerateSlug?: boolean;
  logoAltText?: string;
  logoUploadMethod?: "url" | "upload";

  // Technical & Affiliate
  trackingUrl?: string;
  countryCodes?: string;
  storeWebsiteUrl?: string;

  // Category & Content
  whyTrustUs?: string;
  moreInformation?: string;
  sidebarContent?: string;
  moreAboutStore?: string;
  shoppingTipsTitle?: string;
  shoppingTipsBullets?: string[];
  faqs?: { question: string; answer: string }[];

  // SEO
  seoPageTitle?: string;
  seoMetaDescription?: string;

  // Flags
  markAsTrending?: boolean;

  // Coupon fields (when row is used as coupon)
  couponType?: "code" | "deal";
  couponCode?: string;
  couponTitle?: string;
  badgeLabel?: string;
  priority?: number;
  active?: boolean;
};
