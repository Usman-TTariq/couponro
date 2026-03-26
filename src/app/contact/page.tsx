import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "./ContactForm";

export const metadata = {
  title: "Contact Us",
  description:
    "Have a deal to share or a question? Contact SeemPromo or submit a coupon so we can help more people save.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen w-full min-w-0 bg-white flex flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 lg:py-8">
        <nav className="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-gray-700">SeemPromo</Link>
          <span className="mx-1.5">›</span>
          <span className="text-gray-700 font-medium">Contact Us</span>
        </nav>

        <section
          className="rounded-2xl border border-[#34C759]/20 bg-[#34C759]/5 p-6 sm:p-8 lg:p-10 mb-8"
          aria-labelledby="contact-heading"
        >
          <p className="text-[#34C759] font-semibold text-sm uppercase tracking-wide mb-2">
            Get in touch
          </p>
          <h1 id="contact-heading" className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Have a deal to share or a question?
          </h1>
          <p className="text-gray-600 mb-6 max-w-xl">
            Use the form below to contact us or submit a coupon so we can help more people save.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/about"
              className="inline-flex items-center justify-center rounded-full border-2 border-[#34C759] text-[#34C759] font-semibold px-5 py-3 hover:bg-[#34C759]/10 transition-colors"
            >
              About Us
            </Link>
            <Link
              href="/contact?share=1"
              className="inline-flex items-center justify-center rounded-full bg-[#34C759] text-white font-semibold px-5 py-3 hover:bg-[#2db34d] transition-colors"
            >
              Share a Coupon
            </Link>
          </div>
        </section>

        <section
          className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 sm:p-8"
          aria-labelledby="form-heading"
        >
          <h2 id="form-heading" className="text-xl font-bold text-gray-900 mb-6">
            Send us a message
          </h2>
          <ContactForm />
        </section>
      </main>
      <Footer />
    </div>
  );
}
