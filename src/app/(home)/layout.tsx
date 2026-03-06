import type { ReactNode } from "react";

export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&family=Montserrat:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&family=Raleway:wght@400;500;600;700;800&family=Merriweather:ital,wght@0,400;0,700;1,400&display=swap"
      />
      <link rel="stylesheet" href="/theme/css/bootstrap.css" />
      <link rel="stylesheet" href="/theme/css/all.css" />
      {children}
    </>
  );
}
