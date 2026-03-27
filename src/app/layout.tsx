import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_NAME = "Couponro";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
};
const DEFAULT_DESCRIPTION =
  "Couponro – Find the best coupon codes, deals, and free shipping offers from top stores. Save money on your shopping with verified discounts and promo codes.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://couponro.com"),
  title: {
    default: `${SITE_NAME} – Coupon Codes, Deals & Free Shipping`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: ["coupon codes", "promo codes", "deals", "discounts", "free shipping", "savings", "Couponro"],
  openGraph: {
    title: `${SITE_NAME} – Coupon Codes, Deals & Free Shipping`,
    description: DEFAULT_DESCRIPTION,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: `${SITE_NAME} – Coupon Codes & Deals`,
    description: DEFAULT_DESCRIPTION,
  },
  icons: {
    icon: "/couponRO%20Fav%20icon.png",
    apple: "/couponRO%20Fav%20icon.png",
    shortcut: "/couponRO%20Fav%20icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-18023143985" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-18023143985');
            `,
          }}
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
