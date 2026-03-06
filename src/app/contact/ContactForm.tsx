"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function ContactFormInner() {
  const searchParams = useSearchParams();
  const isShare = searchParams.get("share") === "1";
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [showThankYou, setShowThankYou] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = (fd.get("name") as string)?.trim() || "";
    const email = (fd.get("email") as string)?.trim() || "";
    const subject = (fd.get("subject") as string)?.trim() || "";
    const message = (fd.get("message") as string)?.trim() || "";
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setStatus("sent");
      form.reset();
      setShowThankYou(true);
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="contact-name" className="block text-sm font-medium text-slate-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-rebecca focus:ring-2 focus:ring-rebecca/20 outline-none transition"
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-sm font-medium text-slate-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-rebecca focus:ring-2 focus:ring-rebecca/20 outline-none transition"
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label htmlFor="contact-subject" className="block text-sm font-medium text-slate-700 mb-1">
            Subject
          </label>
          <input
            id="contact-subject"
            name="subject"
            type="text"
            defaultValue={isShare ? "Share a coupon" : ""}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-rebecca focus:ring-2 focus:ring-rebecca/20 outline-none transition"
            placeholder="e.g. Question, Share a coupon, Feedback"
          />
        </div>
        <div>
          <label htmlFor="contact-message" className="block text-sm font-medium text-slate-700 mb-1">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            rows={5}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-rebecca focus:ring-2 focus:ring-rebecca/20 outline-none transition resize-y"
            placeholder="Your message or coupon details..."
          />
        </div>
        {status === "error" && (
          <p className="text-red-600 font-medium">Something went wrong. Please try again.</p>
        )}
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded-xl bg-space text-white font-semibold px-6 py-3 hover:bg-slate-800 disabled:opacity-60 transition-colors"
        >
          {status === "sending" ? "Sending…" : "Send message"}
        </button>
      </form>

      {showThankYou && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          aria-modal="true"
          role="dialog"
          aria-labelledby="thankyou-title"
          onClick={() => setShowThankYou(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 id="thankyou-title" className="text-xl font-bold text-slate-900 mb-2">
              Thank you!
            </h2>
            <p className="text-slate-600 mb-6">
              We&apos;ve received your message and will get back to you soon.
            </p>
            <button
              type="button"
              onClick={() => setShowThankYou(false)}
              className="rounded-xl bg-rebecca text-white font-semibold px-6 py-3 hover:opacity-90 transition-opacity w-full sm:w-auto min-w-[140px]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function ContactForm() {
  return (
    <Suspense fallback={<p className="text-slate-500">Loading form…</p>}>
      <ContactFormInner />
    </Suspense>
  );
}
