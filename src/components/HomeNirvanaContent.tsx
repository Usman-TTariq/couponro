"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DEFAULT_BLOG_POST_URL, STORES_BLOG_POST_URL, FREE_SHIPPING_BLOG_POST_URL, DEALS_BLOG_POST_URL, FOOTER_TILE_BLOG_URLS, FOOTER_TILE_TITLES } from "@/lib/blog-posts";

// Big layouts (hero, fullwidth, footer bg, 950x450): use larger images
const HERO_IMGS = ["/img01.jpg", "/img03.jpg", "/img04.jpg"];
const IMG_FULLWIDTH = "/img06.jpg";
const IMG_FOOTER_BG = "/img32.jpg";
const IMG_950 = ["/img05.jpg", "/img07.jpg", "/img10.jpg", "/img31.jpg"];
// Medium (634x360, 385x260 nav)
const IMG_634 = ["/img02.jpg", "/img08.jpg", "/img09.jpg"];
const IMG_NAV = ["/img29.jpg", "/img30.jpg", "/img40.jpg"];
// Small (190x190 footer grid): use smaller images
const IMG_190 = ["/img13.jpg", "/img14.jpg", "/img15.jpg", "/img16.jpg", "/img17.jpg", "/img18.jpg"];

const NAV_LINKS = [
  { href: "/coupons", label: "Coupons" },
  { href: "/stores", label: "Stores" },
  { href: "/freeshipping", label: "Free Shipping" },
  { href: "/blog", label: "Blogs" },
];

// Sidebar quick links (humari links)
const SIDEBAR_LINKS = [
  { href: "/coupons", label: "Coupons" },
  { href: "/stores", label: "Stores" },
  { href: "/freeshipping", label: "Free Shipping" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/categories", label: "Categories" },
];

export default function HomeNirvanaContent() {
  const [navOpen, setNavOpen] = useState(false);

  // Theme sidebar: body.nav-active shifts .w1 and shows .nav-holder
  useEffect(() => {
    if (navOpen) document.body.classList.add("nav-active");
    else document.body.classList.remove("nav-active");
    return () => document.body.classList.remove("nav-active");
  }, [navOpen]);

  // Close sidebar when clicking outside (theme behaviour)
  useEffect(() => {
    if (!navOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(".nav-holder") || target.closest(".nav-opener") || target.closest(".nav-opener-react")) return;
      setNavOpen(false);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [navOpen]);

  const closeNav = () => setNavOpen(false);

  return (
    <>
      <div id="wrapper">
        <div className="w1">
          <header id="header" className="container-fluid">
            <div className="row">
              <div className="col-xs-12">
                <div className="logo">
                  <Link href="/">
                    <img className="img-responsive" src="/couponro-logo.svg" alt="Couponro" />
                  </Link>
                </div>
                <div id="nav">
                  <button
                    type="button"
                    className="nav-opener-react"
                    aria-label={navOpen ? "Close menu" : "Open menu"}
                    onClick={() => setNavOpen((o) => !o)}
                  >
                    <span />
                    <span />
                    <span />
                  </button>
                  <div className="nav-holder" role="dialog" aria-label="Menu">
                    <button
                      type="button"
                      className="btn-close-react"
                      aria-label="Close menu"
                      onClick={closeNav}
                    >
                      <i className="fa fa-times" />
                    </button>
                    <form action="/coupons" method="GET" className="search-form">
                      <input type="search" name="q" className="form-control" placeholder="Search store or brand" />
                      <button type="submit" className="btn btn-default"><i className="fa fa-search" /></button>
                    </form>
                    <ul className="list-inline">
                      {NAV_LINKS.map(({ href, label }) => (
                        <li key={href}>
                          <Link href={href} onClick={closeNav}>{label.toUpperCase()}</Link>
                        </li>
                      ))}
                    </ul>
                    <ul className="list-inline" style={{ marginTop: "0.5rem", paddingBottom: "1.5rem" }}>
                      {SIDEBAR_LINKS.filter((l) => !NAV_LINKS.some((n) => n.href === l.href)).map(({ href, label }) => (
                        <li key={href} style={{ marginRight: "1rem", marginBottom: "0.5rem" }}>
                          <Link href={href} onClick={closeNav} style={{ fontSize: "14px", textTransform: "none" }}>{label}</Link>
                        </li>
                      ))}
                    </ul>
                    <div className="nav-posts">
                      <strong className="title"><Link href={DEFAULT_BLOG_POST_URL} onClick={closeNav}>POPULAR POSTS</Link></strong>
                      <Link href={DEFAULT_BLOG_POST_URL} className="banner-gallery" onClick={closeNav}>
                        <img src={IMG_NAV[0]} alt="" loading="eager" decoding="async" />
                        <div className="post-over">
                          <div className="box">
                            <div className="block">
                              <h3>Featured</h3>
                              <ul className="add-nav list-inline">
                                <li>by Couponro</li>
                                <li><time dateTime="2026-03-04">Mar 4, 2026</time></li>
                                <li>Blog</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </Link>
                      <Link href="/coupons" className="banner-gallery" onClick={closeNav}>
                        <img src={IMG_NAV[1]} alt="" loading="eager" decoding="async" />
                        <div className="post-over">
                          <div className="box">
                            <div className="block">
                              <h3>Coupons</h3>
                              <ul className="add-nav list-inline">
                                <li>by Couponro</li>
                                <li><time dateTime="2026-03-04">Mar 4, 2026</time></li>
                                <li>Coupons</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </Link>
                      <Link href={DEFAULT_BLOG_POST_URL} className="banner-gallery" onClick={closeNav}>
                        <img src={IMG_NAV[2]} alt="" loading="eager" decoding="async" />
                        <div className="post-over quotes">
                          <div className="box">
                            <div className="block">
                              <blockquote className="post-quotes">
                                <p>&ldquo;Saving tips&rdquo;</p>
                                <cite title="Couponro">Couponro</cite>
                              </blockquote>
                              <ul className="add-nav list-inline">
                                <li><time dateTime="2026-03-04">Mar 4, 2026</time></li>
                                <li>Quote</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                    <ul className="social-networks list-inline">
                      <li><a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><i className="fa fa-facebook" /></a></li>
                      <li><a href="https://x.com" target="_blank" rel="noopener noreferrer"><i className="fa fa-twitter" /></a></li>
                      <li><a href="https://plus.google.com" target="_blank" rel="noopener noreferrer"><i className="fa fa-google-plus" /></a></li>
                    </ul>
                    <span className="copyrights" suppressHydrationWarning>&copy; {new Date().getFullYear()} <Link href="/" onClick={closeNav}>Couponro</Link>. All rights reserved.</span>
                  </div>
                </div>
              </div>
            </div>
          </header>
          <main id="main" role="main">
            <div className="container-fluid">
              <div className="row">
                <div className="col-xs-12">
                    <section className="hero-three" aria-label="Hero">
                      <div className="row">
                        <div className="col-sm-4 col-xs-12">
                          <Link href={DEFAULT_BLOG_POST_URL} className="banner-gallery">
                            <div className="bg-stretch">
                              <img src={HERO_IMGS[0]} alt="Featured" loading="eager" decoding="async" />
                            </div>
                            <div className="post-over">
                              <div className="box">
                                <div className="block">
                                  <h2><Link href={DEFAULT_BLOG_POST_URL}>Featured</Link></h2>
                                  <ul className="add-nav list-inline">
                                    <li>by <Link href="/">Couponro</Link></li>
                                    <li><time dateTime="2026-03-04">Mar 4, 2026</time></li>
                                    <li><Link href={DEFAULT_BLOG_POST_URL}>Blog</Link></li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </div>
                        <div className="col-sm-4 col-xs-12">
                          <Link href={DEFAULT_BLOG_POST_URL} className="banner-gallery">
                            <div className="bg-stretch">
                              <img src={HERO_IMGS[1]} alt="Saving tips" />
                            </div>
                            <div className="post-over">
                              <div className="box">
                                <div className="block">
                                  <h2><Link href={DEFAULT_BLOG_POST_URL}>Saving tips</Link></h2>
                                  <ul className="add-nav list-inline">
                                    <li>by <Link href="/">Couponro</Link></li>
                                    <li><time dateTime="2026-03-04">Mar 4, 2026</time></li>
                                    <li><Link href={DEFAULT_BLOG_POST_URL}>Blog</Link></li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </div>
                        <div className="col-sm-4 col-xs-12">
                          <Link href={DEFAULT_BLOG_POST_URL} className="banner-gallery">
                            <div className="bg-stretch">
                              <img src={HERO_IMGS[2]} alt="Coupon codes" loading="eager" decoding="async" />
                            </div>
                            <div className="post-over">
                              <div className="box">
                                <div className="block">
                                  <h2><Link href={DEFAULT_BLOG_POST_URL}>Coupon codes</Link></h2>
                                  <ul className="add-nav list-inline">
                                    <li>by <Link href="/">Couponro</Link></li>
                                    <li><time dateTime="2026-03-04">Mar 4, 2026</time></li>
                                    <li><Link href={DEFAULT_BLOG_POST_URL}>Coupons</Link></li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </div>
                      </div>
                    </section>
                </div>
              </div>
            </div>

            <div className="container-fluid">
              <div className="row">
                <div className="col-sm-6 col-xs-12 two-cols">
                  <div className="row">
                    <div className="col-xs-12">
                    <section className="main-gallery">
                      <div className="mask">
                        <div className="slideset">
                          <div className="slide">
                            <div className="bg-stretch">
                              <img src={IMG_950[0]} alt="Gallery" loading="eager" decoding="async" />
                            </div>
                            <div className="post-over">
                              <div className="box">
                                <div className="block">
                                  <h2><Link href={DEFAULT_BLOG_POST_URL}>Blog post</Link></h2>
                                  <ul className="add-nav list-inline">
                                    <li>by <Link href={DEFAULT_BLOG_POST_URL}>Couponro</Link></li>
                                    <li><time dateTime="2026-03-04">Mar 4, 2026</time></li>
                                    <li><Link href={DEFAULT_BLOG_POST_URL}>Blog</Link></li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <a className="btn-prev" href="#"><i className="fa fa-angle-left" /></a>
                      <a className="btn-next" href="#"><i className="fa fa-angle-right" /></a>
                    </section>
                    </div>
                  </div>
                </div>
                <div className="col-sm-6 col-xs-12 two-cols">
                  <div className="row">
                    <div className="col-xs-12">
                    <article className="banner-gallery trending">
                      <div className="bg-stretch">
                        <img src={IMG_950[1]} alt="Trending" loading="eager" decoding="async" />
                      </div>
                      <div className="post-over">
                        <div className="box">
                          <div className="block">
                            <h2><Link href={DEFAULT_BLOG_POST_URL}>Trending</Link></h2>
                            <ul className="add-nav list-inline">
                              <li>by <Link href={DEFAULT_BLOG_POST_URL}>Couponro</Link></li>
                              <li><time dateTime="2026-03-04">Mar 4, 2026</time></li>
                              <li><Link href={DEFAULT_BLOG_POST_URL}>Blog</Link></li>
                            </ul>
                            <Link href={DEFAULT_BLOG_POST_URL} className="btn-flash"><i className="fa fa-bolt" /></Link>
                          </div>
                        </div>
                      </div>
                    </article>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="container-fluid">
              <div className="row">
                <div className="col-sm-4 col-xs-12 three-cols">
                  <div className="row">
                    <div className="col-xs-12">
                    <div className="banner-gallery">
                      <div className="bg-stretch">
                        <img src={IMG_634[0]} alt="Quote" loading="eager" decoding="async" />
                      </div>
                      <div className="post-over quotes">
                        <div className="box">
                          <div className="block">
                            <blockquote className="post-quotes">
                              <p><Link href={DEFAULT_BLOG_POST_URL}>&ldquo;Saving tips &amp; deals&rdquo;</Link></p>
                              <footer><cite title="Couponro">Couponro</cite></footer>
                            </blockquote>
                            <ul className="add-nav list-inline">
                              <li><time dateTime="2026-03-04">Mar 4, 2026</time></li>
                              <li>Quote</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    </div>
                  </div>
                </div>
                <div className="col-sm-4 col-xs-12 three-cols">
                  <div className="row">
                    <div className="col-xs-12">
                    <Link href={STORES_BLOG_POST_URL} className="banner-gallery">
                      <div className="bg-stretch">
                        <img src={IMG_950[0]} alt="Stores" loading="eager" decoding="async" />
                      </div>
                      <div className="post-over">
                        <div className="box">
                          <div className="block">
                            <h3><span>Stores</span></h3>
                            <ul className="add-nav list-inline">
                              <li>by <Link href="/">Couponro</Link></li>
                              <li><time dateTime="2026-03-04">Mar 4, 2026</time></li>
                              <li><span>Stores</span></li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </Link>
                    </div>
                  </div>
                </div>
                <div className="col-sm-4 col-xs-12 three-cols">
                  <div className="row">
                    <div className="col-xs-12">
                    <Link href={DEFAULT_BLOG_POST_URL} className="banner-gallery">
                      <div className="bg-stretch">
                        <img src={IMG_950[1]} alt="Coupons" loading="eager" decoding="async" />
                      </div>
                      <div className="post-over">
                        <div className="box">
                          <div className="block">
                            <h3><span>Coupons</span></h3>
                            <ul className="add-nav list-inline">
                              <li>by <Link href="/">Couponro</Link></li>
                              <li><time dateTime="2026-03-04">Mar 4, 2026</time></li>
                              <li><span>Coupons</span></li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="container-fluid">
              <div className="row">
                <article className="col-xs-12 fullwidth-post">
                  <div className="row">
                    <div className="col-xs-12">
                    <div className="banner-gallery parallax-holder">
                      <div className="parallax-frame">
                        <img src={IMG_FULLWIDTH} height={1333} width={2000} alt="Fullwidth" loading="eager" decoding="async" />
                      </div>
                      <div className="post-over">
                        <div className="box">
                          <div className="block">
                            <h2><Link href={DEFAULT_BLOG_POST_URL}>Blog</Link></h2>
                            <ul className="add-nav list-inline">
                              <li>by <Link href="/">Couponro</Link></li>
                              <li><time dateTime="2026-03-04">Mar 4, 2026</time></li>
                              <li><Link href={DEFAULT_BLOG_POST_URL}>Blog</Link></li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    </div>
                  </div>
                </article>
              </div>
            </div>

            <div className="container-fluid">
              <div className="row">
                <div className="col-sm-6 col-xs-12 two-cols">
                  <div className="row">
                    <div className="col-xs-12">
                    <article className="banner-gallery">
                      <div className="bg-stretch">
                        <img src={IMG_950[2]} alt="Free Shipping" />
                      </div>
                      <div className="post-over">
                        <div className="box">
                          <div className="block">
                            <h2><Link href={FREE_SHIPPING_BLOG_POST_URL}>Free Shipping</Link></h2>
                            <ul className="add-nav list-inline">
                              <li>by <Link href="/">Couponro</Link></li>
                              <li><time dateTime="2026-03-04">Mar 4, 2026</time></li>
                              <li><Link href={FREE_SHIPPING_BLOG_POST_URL}>Free Shipping</Link></li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </article>
                    </div>
                  </div>
                </div>
                <div className="col-sm-6 col-xs-12 two-cols">
                  <div className="row">
                    <div className="col-xs-12">
                    <article className="banner-gallery">
                      <div className="bg-stretch">
                        <img src={IMG_950[3]} alt="Deals" loading="eager" decoding="async" />
                      </div>
                      <div className="post-over">
                        <div className="box">
                          <div className="block">
                            <h2><Link href={DEALS_BLOG_POST_URL}>Deals</Link></h2>
                            <ul className="add-nav list-inline">
                              <li>by <Link href="/">Couponro</Link></li>
                              <li><time dateTime="2026-03-04">Mar 4, 2026</time></li>
                              <li><Link href={DEALS_BLOG_POST_URL}>Coupons</Link></li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </article>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>

          <div className="footer-holder parallax-holder">
            <div className="parallax-frame">
              <img src={IMG_FOOTER_BG} height={541} width={1920} alt="" />
            </div>
            <div className="post-over" />
            <div className="container">
              <aside className="row footer-aside">
                <div className="col-sm-3 col-xs-12 column social">
                  <div className="footer-logo mb-3">
                    <Link href="/" aria-label="Couponro Home">
                      <img className="img-responsive" src="/couponro%20logo%20svg.svg" alt="Couponro" style={{ maxHeight: "56px", width: "auto" }} />
                    </Link>
                  </div>
                  <p>Couponro helps you save with verified coupon codes, promo codes, and free shipping offers from top stores.</p>
                  <h3><span className="txt"><Link href={DEFAULT_BLOG_POST_URL}>Blog</Link></span></h3>
                  <ul className="social-networks list-inline">
                    <li><a href="#"><i className="fa fa-facebook" /></a></li>
                    <li><a href="#"><i className="fa fa-twitter" /></a></li>
                    <li><a href="#"><i className="fa fa-google-plus" /></a></li>
                  </ul>
                </div>
                <div className="col-sm-3 col-xs-12 column">
                  <h3><span className="txt"><Link href={DEFAULT_BLOG_POST_URL}>Categories</Link></span></h3>
                  <ul className="info-nav list-inline">
                    <li><Link href="/coupons">Coupons</Link></li>
                    <li><Link href="/stores">Stores</Link></li>
                    <li><Link href="/freeshipping">Free Shipping</Link></li>
                  </ul>
                  <h3><span className="txt"><Link href={DEFAULT_BLOG_POST_URL}>Tags</Link></span></h3>
                  <ul className="info-nav list-inline">
                    <li><Link href="/coupons">Deals</Link></li>
                    <li><Link href={DEFAULT_BLOG_POST_URL}>Saving tips</Link></li>
                  </ul>
                </div>
                <div className="col-sm-6 col-xs-12">
                  <ul className="instagram-nav list-inline">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <li key={i}>
                        <Link href={FOOTER_TILE_BLOG_URLS[i - 1]}>
                          <img className="img-responsive" src={IMG_190[i - 1]} alt="" loading="eager" decoding="async" />
                          <span className="btn-instagram"><i className="fa fa-instagram" /></span>
                          <div className="insta-over">
                            <span className="title">{FOOTER_TILE_TITLES[i - 1]}</span>
                            <h3>Couponro</h3>
                            <time dateTime="2026-03-04">Mar 4, 2026</time>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
              <footer id="footer" className="row">
                <div className="col-xs-12">
                  <span className="copyrights" suppressHydrationWarning>&copy; {new Date().getFullYear()} <Link href="/">Couponro</Link>. All rights reserved.</span>
                  <ul className="footer-nav list-inline">
                    <li><Link href="/">Home</Link></li>
                    <li><Link href="/coupons">Coupons</Link></li>
                    <li><Link href="/stores">Stores</Link></li>
                    <li><Link href={DEFAULT_BLOG_POST_URL}>Blog</Link></li>
                  </ul>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </div>

      <ThemeScripts />
    </>
  );
}

function ThemeScripts() {
  useEffect(() => {
    if (typeof window === "undefined" || (window as unknown as { __nirvanaLoaded?: boolean }).__nirvanaLoaded) return;
    const loadScript = (src: string): Promise<void> =>
      new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = src;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.body.appendChild(s);
      });
    const run = () => {
      const base = "/theme/js";
      loadScript(`${base}/jquery-1.11.2.min.js`)
        .then(() => loadScript(`${base}/bootstrap.min.js`))
        .then(() => loadScript(`${base}/jquery.main.js`))
        .then(() => {
          (window as unknown as { __nirvanaLoaded?: boolean }).__nirvanaLoaded = true;
        })
        .catch(() => {});
    };
    const t = setTimeout(run, 800);
    return () => clearTimeout(t);
  }, []);
  return null;
}
