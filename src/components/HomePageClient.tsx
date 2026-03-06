"use client";

import HomeNirvanaContent from "./HomeNirvanaContent";

/**
 * Renders full content on server so Ctrl+U (View Source) shows clean HTML.
 * No ClientOnly – same HTML from server and client for hydration.
 */
export default function HomePageClient() {
  return (
    <div className="min-h-screen flex flex-col">
      <HomeNirvanaContent />
    </div>
  );
}
