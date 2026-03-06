"use client";

import { useState } from "react";
import Link from "next/link";

const FAQ_ITEMS = [
  {
    question: "What is a promo code?",
    answer:
      "A promo code is an alphanumeric phrase used during checkout to receive an online discount (or other benefit) on the purchase of e-commerce goods or services. It is used interchangeably with terms like coupon code, discount code, voucher code and sometimes is simply referred to as an online digital coupon. You can find promo codes for thousands of brands and learn more about couponing to maximize your savings by using the resources on the Couponro website.",
    linkText: "Couponro website",
    linkHref: "/",
  },
  {
    question: "How can I get a discount or promo code every time I shop?",
    answer:
      "Visit Couponro before you shop to browse the latest coupon codes and deals for your favorite stores. You can search by store name or category, and we update our listings regularly. Always check the merchant website to confirm the code is valid before checkout.",
  },
  {
    question: "Do promo codes work?",
    answer:
      "Yes. Promo codes from Couponro are verified and updated by our team. Some codes may expire or have usage limits, so we recommend trying the code at checkout and checking the merchant's terms. If one code doesn't work, try an alternative or contact the store's customer support.",
  },
  {
    question: "Are your coupons free to use?",
    answer:
      "Yes. All coupon codes and deals listed on Couponro are free for visitors to use. We may earn a commission when you use our links to make a purchase, at no extra cost to you. This helps us keep the site running and updated.",
  },
];

const POPULAR_ARTICLES = [
  { label: "How to use coupon codes", href: "/#coupons" },
  { label: "Top stores with deals", href: "/#stores" },
  { label: "Saving tips and guides", href: "/blog" },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="bg-[#eef6fa] py-12 md:py-16"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2
          id="faq-heading"
          className="text-2xl md:text-3xl font-bold text-[#37474f] text-center mb-8"
        >
          Frequently Asked Questions
        </h2>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="rounded-xl bg-white shadow-sm border border-slate-200/80 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 hover:bg-slate-50/50 transition-colors"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  id={`faq-question-${index}`}
                >
                  <span className="font-semibold text-[#37474f] text-sm sm:text-base pr-2">
                    {item.question}
                  </span>
                  <span
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-[#37474f] transition-transform"
                    aria-hidden
                  >
                    <svg
                      className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </span>
                </button>
                <div
                  id={`faq-answer-${index}`}
                  role="region"
                  aria-labelledby={`faq-question-${index}`}
                  className={`grid transition-[grid-template-rows] duration-200 ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-4 pt-0 text-sm text-[#546e7a] leading-relaxed border-t border-slate-100">
                      {item.linkText && item.linkHref ? (
                        <p>
                          {item.answer.split(item.linkText)[0]}
                          <Link
                            href={item.linkHref}
                            className="text-[#1e88e5] hover:underline font-medium"
                          >
                            {item.linkText}
                          </Link>
                          {item.answer.split(item.linkText)[1]}
                        </p>
                      ) : (
                        <p>{item.answer}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 pt-8 border-t border-dashed border-slate-300">
          <p className="text-sm font-semibold text-[#37474f] mb-3">
            Popular articles:
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {POPULAR_ARTICLES.map((a) => (
              <li key={a.href}>
                <Link
                  href={a.href}
                  className="text-[#1e88e5] hover:underline"
                >
                  {a.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
