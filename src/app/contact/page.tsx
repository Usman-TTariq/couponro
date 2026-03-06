import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "./ContactForm";

export const metadata = {
  title: "Contact Us",
  description:
    "Have a deal to share or a question? Contact Couponro or submit a coupon so we can help more people save.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#f0f5fa] flex flex-col">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 py-8">
        <nav className="text-sm text-slate-600 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-rebecca">
            Couponro
          </Link>
          <span className="mx-2">›</span>
          <span className="text-space font-medium">Contact Us</span>
        </nav>

        <section
          className="rounded-2xl bg-space text-white p-6 sm:p-8 lg:p-10 mb-8"
          aria-labelledby="contact-heading"
        >
          <p className="text-soft-cyan font-semibold text-sm uppercase tracking-wide mb-2">
            Get in touch
          </p>
          <h1 id="contact-heading" className="text-2xl sm:text-3xl font-bold mb-3">
            Have a deal to share or a question?
          </h1>
          <p className="text-white/90 mb-6 max-w-xl">
            Use the form below to contact us or submit a coupon so we can help more people save.
          </p>
          <div className="flex flex-wrap gap-3 mb-8">
            <Link
              href="/about"
              className="inline-flex items-center justify-center rounded-xl border-2 border-white text-white font-semibold px-5 py-3 hover:bg-white/10 transition-colors"
            >
              About Us
            </Link>
            <Link
              href="/contact?share=1"
              className="inline-flex items-center justify-center rounded-xl bg-lobster text-white font-semibold px-5 py-3 hover:bg-lobster/90 transition-colors"
            >
              Share a Coupon
            </Link>
          </div>
        </section>

        <section
          className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 sm:p-8"
          aria-labelledby="form-heading"
        >
          <h2 id="form-heading" className="text-xl font-bold text-slate-900 mb-6">
            Send us a message
          </h2>
          <ContactForm />
        </section>
      </main>
      <Footer />
    </div>
  );
}
