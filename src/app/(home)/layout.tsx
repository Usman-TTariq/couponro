import type { ReactNode } from "react";

const THEME_FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&family=Montserrat:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&family=Raleway:wght@400;500;600;700;800&family=Merriweather:ital,wght@0,400;0,700;1,400&display=swap";

export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={THEME_FONT_HREF} />
        <link rel="stylesheet" href="/theme/css/bootstrap.css" />
        <link rel="stylesheet" href="/theme/css/all.css" />
      </head>
      {children}
    </>
  );
}
