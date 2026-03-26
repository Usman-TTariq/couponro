import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Terms of Use",
  description:
    "Terms of Use for SeemPromo. By using our website you agree to these terms. Read our conditions of use for coupon codes and deals.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen w-full min-w-0 bg-white flex flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 lg:py-8">
        <nav className="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-gray-700">SeemPromo</Link>
          <span className="mx-1.5">›</span>
          <span className="text-gray-700 font-medium">Terms of Use</span>
        </nav>

        <article className="prose prose-slate max-w-3xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Terms of Use</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: March 2026</p>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              By accessing or using SeemPromo (&quot;we&quot;, &quot;our&quot;, or &quot;the site&quot;), you agree to be bound by these Terms of Use. 
              If you do not agree, please do not use our website. We may update these terms from time to time; continued use after changes constitutes acceptance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3">2. Use of the Service</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              SeemPromo provides coupon codes, promo codes, deals, and free shipping information from third-party merchants. 
              You may use the site for personal, non-commercial purposes to find and use offers. You may not scrape, copy, or 
              redistribute our content for commercial use without permission. You are responsible for verifying that any coupon 
              or offer is valid on the merchant&apos;s website before purchase.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3">3. Affiliate Disclosure</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We may earn a commission when you click on certain links or use coupon codes and make a purchase on a merchant&apos;s 
              site. This does not affect the price you pay. Our content and recommendations are intended to help you save; we do 
              not guarantee the availability or accuracy of any offer.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3">4. Disclaimer</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              The site and all content are provided &quot;as is&quot;. We do not guarantee that coupon codes or deals will work at checkout. 
              Merchants may change or expire offers without notice. We are not responsible for any loss or disappointment arising 
              from your use of third-party offers or websites.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3">5. Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              For questions about these Terms of Use, please <Link href="/contact" className="text-[#34C759] hover:underline">contact us</Link>.
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
}
