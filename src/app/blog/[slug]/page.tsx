import { notFound } from "next/navigation";
import Link from "next/link";
import ThemeBlogLayout from "@/components/ThemeBlogLayout";
import PortableText from "@/components/PortableText";
import { getPostBySlug, getAllSlugs } from "@/lib/blog-posts";
import { getSanityPostBySlug, getSanityPostSlugs } from "@/lib/sanity.blog";
import { getStoreBlogContent } from "@/lib/store-blog-content";
import TouchTunesPost from "../posts/TouchTunesPost";
import StoreBlogPost from "../posts/StoreBlogPost";
import CouponroSavingTipsPost from "../posts/CouponroSavingTipsPost";
import StoresGuidePost from "../posts/StoresGuidePost";
import FreeShippingPost from "../posts/FreeShippingPost";
import DealsGuidePost from "../posts/DealsGuidePost";
import FreshFindsPost from "../posts/FreshFindsPost";
import SeasonalSavingsPost from "../posts/SeasonalSavingsPost";
import KitchenCoffeePost from "../posts/KitchenCoffeePost";
import TravelGetawayPost from "../posts/TravelGetawayPost";
import HomeGardenSavingsPost from "../posts/HomeGardenSavingsPost";
import FashionOutdoorPost from "../posts/FashionOutdoorPost";

const SITE_NAME = "SeemPromo";
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://seempromo.vercel.app";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const sanitySlugs = await getSanityPostSlugs();
  const staticSlugs = getAllSlugs();
  const combined = [...new Set([...sanitySlugs, ...staticSlugs])];
  return combined.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const sanityPost = await getSanityPostBySlug(slug);
  if (sanityPost) {
    const { normalized, ogImageUrl } = sanityPost;
    const title = normalized.metaTitle || normalized.title;
    const description = normalized.metaDescription || normalized.excerpt;
    return {
      title: `${title} | ${SITE_NAME} Blog`,
      description,
      openGraph: {
        title,
        description,
        type: "article",
        images: ogImageUrl ? [{ url: ogImageUrl, width: 1200, height: 630, alt: normalized.title }] : undefined,
      },
      twitter: { card: "summary_large_image", title, description },
    };
  }
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post not found" };
  return {
    title: `${post.metaTitle} | ${SITE_NAME} Blog`,
    description: post.metaDescription,
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      type: "article",
      images: post.featuredImage
        ? [{ url: BASE_URL + post.featuredImage, width: 1200, height: 630, alt: post.title }]
        : undefined,
    },
    twitter: { card: "summary_large_image", title: post.metaTitle, description: post.metaDescription },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const sanityPost = await getSanityPostBySlug(slug);
  let post: {
    slug: string;
    title: string;
    date: string;
    category: string;
    featuredImage: string | null;
    author?: string;
    excerpt?: string;
    metaDescription?: string;
  };
  let content: React.ReactNode;

  if (sanityPost) {
    post = {
      slug: sanityPost.normalized.slug,
      title: sanityPost.normalized.title,
      date: sanityPost.normalized.date,
      category: sanityPost.normalized.category,
      featuredImage: sanityPost.normalized.featuredImage,
      author: sanityPost.normalized.author,
      excerpt: sanityPost.normalized.excerpt,
      metaDescription: sanityPost.normalized.metaDescription,
    };
    content =
      sanityPost.body && sanityPost.body.length > 0 ? (
        <PortableText value={sanityPost.body} />
      ) : (
        <p className="text-space/90">No content yet.</p>
      );
  } else {
    const staticPost = getPostBySlug(slug);
    if (!staticPost) notFound();
    post = staticPost;

    if (slug === "stores-coupon-deals-guide-2026") {
      content = <StoresGuidePost />;
    } else if (slug === "seempromo-saving-tips-coupon-codes-guide-2026") {
      content = <CouponroSavingTipsPost />;
    } else if (slug === "touchtunes-coupon-codes-deals-discounts-2026") {
      content = <TouchTunesPost />;
    } else if (slug === "free-shipping-deals-guide-2026") {
      content = <FreeShippingPost />;
    } else if (slug === "top-deals-coupons-guide-2026") {
      content = <DealsGuidePost />;
    } else if (slug === "fresh-finds-saving-tips-2026") {
      content = <FreshFindsPost />;
    } else if (slug === "seasonal-savings-guide-2026") {
      content = <SeasonalSavingsPost />;
    } else if (slug === "kitchen-coffee-deals-2026") {
      content = <KitchenCoffeePost />;
    } else if (slug === "travel-getaway-deals-2026") {
      content = <TravelGetawayPost />;
    } else if (slug === "home-garden-savings-2026") {
      content = <HomeGardenSavingsPost />;
    } else if (slug === "fashion-outdoor-deals-2026") {
      content = <FashionOutdoorPost />;
    } else {
      const storeContent = getStoreBlogContent(slug);
      if (storeContent) {
        content = <StoreBlogPost title={post.title} content={storeContent} slug={slug} />;
      } else {
        notFound();
      }
    }
  }

  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const displayAuthor = ((post.author ?? "").trim().toLowerCase() === "seempromo" || !(post.author ?? "").trim())
    ? "Couponro"
    : (post.author as string);

  return (
    <ThemeBlogLayout>
      {/* Theme-style post banner */}
      <div className="container-fluid">
        <div className="row">
          <div className="col-xs-12">
            <section className="main-banner post">
              <div className="parallax-holder add-banner">
                <div className="parallax-frame">
                  {post.featuredImage ? (
                    <div style={{ position: "relative", minHeight: "clamp(280px, 46vw, 620px)" }}>
                      <img
                        src={post.featuredImage}
                        alt=""
                        height={660}
                        width={1400}
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <div
                        aria-hidden
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "linear-gradient(180deg, rgba(10,10,20,0.25) 0%, rgba(10,10,20,0.6) 60%, rgba(10,10,20,0.75) 100%)",
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{ position: "relative", minHeight: "clamp(280px, 46vw, 620px)" }}>
                      <img
                        src="/img05.jpg"
                        alt=""
                        height={660}
                        width={1400}
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <div
                        aria-hidden
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "linear-gradient(180deg, rgba(10,10,20,0.25) 0%, rgba(10,10,20,0.6) 60%, rgba(10,10,20,0.75) 100%)",
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="post-over">
                <div className="box">
                  <div className="block">
                    <h1><Link href={`/blog/${post.slug}`}>{post.title}</Link></h1>
                    <ul className="add-nav list-inline">
                      <li>by <Link href="/">{displayAuthor}</Link></li>
                      <li><time dateTime={post.date}>{formattedDate}</time></li>
                      <li><Link href="/blog">{post.category}</Link></li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Post content - theme post-info section */}
      <section className="post-info">
        <div className="container">
          <div className="row">
            <div className="col-xs-12">
              <article className="main-post">
                <nav className="text-sm mb-6" style={{ opacity: 0.8 }} aria-label="Breadcrumb">
                  <Link href="/" className="hover:underline">SeemPromo</Link>
                  <span className="mx-2">›</span>
                  <Link href="/blog" className="hover:underline">Blog</Link>
                  <span className="mx-2">›</span>
                  <span>{post.title}</span>
                </nav>
                <div className="post-body">
                  {(post.excerpt || post.metaDescription) ? (
                    <div className="mb-6">
                      <p className="text-space/90 leading-7 text-[16px]">
                        {post.excerpt || post.metaDescription}
                      </p>
                    </div>
                  ) : null}
                  {content}
                </div>
              </article>
              <div className="postbox-prev">
                <Link href="/blog" className="post-prev"><i className="fa fa-angle-left" /></Link>
                <span className="post-txt">BACK TO BLOG</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </ThemeBlogLayout>
  );
}
