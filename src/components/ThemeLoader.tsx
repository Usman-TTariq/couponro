"use client";

import { useEffect } from "react";

const THEME_CSS = ["/theme/css/bootstrap.css", "/theme/css/all.css"];
const GOOGLE_FONTS =
  "https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&family=Montserrat:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&family=Raleway:wght@400;500;600;700;800&family=Merriweather:ital,wght@0,400;0,700;1,400&display=swap";

export default function ThemeLoader() {
  useEffect(() => {
    const links: HTMLLinkElement[] = [];
    [GOOGLE_FONTS, ...THEME_CSS].forEach((href) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
      links.push(link);
    });
    return () => {
      links.forEach((link) => {
        if (link.parentNode) link.parentNode.removeChild(link);
      });
    };
  }, []);
  return null;
}
