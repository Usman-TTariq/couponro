import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for SeemPromo. Learn how we collect, use, and protect your information when you use our coupon and deals website.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen w-full min-w-0 bg-white flex flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 lg:py-8">
        <nav className="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-gray-700">SeemPromo</Link>
          <span className="mx-1.5">›</span>
          <span className="text-gray-700 font-medium">Privacy Policy</span>
        </nav>

        <article className="prose prose-slate max-w-3xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: March 2026</p>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3">1. Introduction</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              SeemPromo (&quot;we&quot;, &quot;our&quot;, or &quot;the site&quot;) respects your privacy. This Privacy Policy explains how we collect, 
              use, and protect information when you visit our website or use our services. By using SeemPromo, you agree to the 
              practices described here.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3">2. Information We Collect</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We may collect information you provide (e.g. when you contact us), and automatically collected information such as 
              IP address, browser type, device type, and pages visited. We may use cookies and similar technologies to improve 
              the site and to support affiliate tracking when you click on merchant links or use coupon codes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3">3. How We Use Information</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We use collected information to operate and improve the site, to personalize content, to analyze usage, and to 
              process affiliate commissions when you make a purchase through our links. We do not sell your personal information 
              to third parties for their marketing purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3">4. Cookies and Tracking</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We and our partners (including merchants and affiliate networks) may use cookies and similar technologies to 
              remember preferences, analyze traffic, and attribute purchases to our links. You can adjust your browser settings 
              to limit or block cookies; some site features may not work as intended if you disable cookies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3">5. Third-Party Links</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Our site contains links to merchant and partner websites. Those sites have their own privacy policies. We are not 
              responsible for the privacy practices of third parties. We encourage you to read their policies when you leave our site.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3">6. Your Rights and Choices</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Depending on where you live, you may have rights to access, correct, or delete your personal data, or to opt out of 
              certain uses. To exercise these rights or ask questions about our practices, please <Link href="/contact" className="text-[#34C759] hover:underline">contact us</Link>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3">7. Changes</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time. We will post the revised policy on this page and update the 
              &quot;Last updated&quot; date. Continued use of the site after changes constitutes acceptance of the updated policy.
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
}
