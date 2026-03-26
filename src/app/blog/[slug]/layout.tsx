import type { ReactNode } from "react";

const THEME_FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&family=Montserrat:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&family=Raleway:wght@400;500;600;700;800&family=Merriweather:ital,wght@0,400;0,700;1,400&display=swap";

/** Theme CSS only for inner blog post pages (e.g. /blog/macys-coupon-codes-2026). */
export default function BlogPostLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={THEME_FONT_HREF} />
        <link rel="stylesheet" href="/theme/css/bootstrap.css" />
        <link rel="stylesheet" href="/theme/css/all.css" />
        <link rel="stylesheet" href="/theme/css/fontawesome-cdn.css" />
      </head>
      {children}
    </>
  );
}
