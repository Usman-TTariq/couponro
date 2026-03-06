"use client";

import Link from "next/link";
import { useState } from "react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [countryOpen, setCountryOpen] = useState(false);

  return (
    <footer className="mt-auto">
      {/* Upper section – same as navbar (Rebecca) */}
      <div className="bg-rebecca text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 lg:py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {/* Logo + Country – same logo as navbar */}
            <div className="lg:col-span-1">
              <Link href="/" className="inline-flex items-center flex-shrink-0" aria-label="Couponro Home">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/couponro-logo.svg"
                  alt="Couponro"
                  className="h-14 sm:h-20 w-auto max-h-24 object-contain object-left max-w-[220px]"
                />
              </Link>
              <div className="mt-4">
                <p className="text-xs text-white/70 mb-2">Change country:</p>
                <button
                  type="button"
                  onClick={() => setCountryOpen((o) => !o)}
                  className="inline-flex items-center gap-2 text-sm text-white/90 hover:text-white border border-white/40 rounded px-3 py-2 bg-white/10"
                  aria-expanded={countryOpen}
                  aria-haspopup="listbox"
                >
                  <span aria-hidden>🌐</span>
                  <span aria-hidden>🇺🇸</span>
                  <span className="text-white/80">United States</span>
                  <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Site Links */}
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4">Site Links</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/about" className="text-white hover:text-lobster transition-colors">About us</Link></li>
                <li><Link href="/privacy" className="text-white hover:text-lobster transition-colors">Privacy Policy</Link></li>
                <li><Link href="/ccpa" className="text-white hover:text-lobster transition-colors">CCPA Privacy Notice</Link></li>
                <li><Link href="/terms" className="text-white hover:text-lobster transition-colors">Terms of Use</Link></li>
                <li><Link href="/accessibility" className="text-white hover:text-lobster transition-colors">Accessibility</Link></li>
                <li><Link href="/categories" className="text-white hover:text-lobster transition-colors">Categories</Link></li>
              </ul>
            </div>

            {/* Info & Tools */}
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4">Info & Tools</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/research" className="text-white hover:text-lobster transition-colors">Research & Data</Link></li>
                <li><Link href="/press" className="text-white hover:text-lobster transition-colors">Press & Media Kit</Link></li>
                <li><Link href="/cently" className="text-white hover:text-lobster transition-colors">Cently</Link></li>
                <li><Link href="/smilematic" className="text-white hover:text-lobster transition-colors">Smilematic</Link></li>
                <li><Link href="/tools" className="text-white hover:text-lobster transition-colors">Editorial Guidelines</Link></li>
              </ul>
            </div>

            {/* Get in Touch */}
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4">Get in Touch</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/support" className="text-white hover:text-lobster transition-colors">Support & Feedback</Link></li>
                <li><a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-lobster transition-colors">X</a></li>
                <li><a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-lobster transition-colors">Facebook</a></li>
                <li><Link href="/contact" className="text-white hover:text-lobster transition-colors">Contact Us</Link></li>
                <li><Link href="/careers" className="text-white hover:text-lobster transition-colors">Careers</Link></li>
              </ul>
            </div>

            {/* About */}
            <div className="sm:col-span-2 lg:col-span-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4">About</h3>
              <p className="text-sm text-white/95 leading-relaxed max-w-sm">
                Couponro tracks coupon codes from online merchants to help consumers save money. We may earn a commission when you use one of our coupons/links to make a purchase. You should check any coupon or promo code of interest on the merchant website to ensure validity before making a purchase.
              </p>
              <Link href="/accessibility" className="mt-3 inline-block text-sm text-white hover:text-lobster transition-colors">
                Open Accessibility Tools
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom strip – copyright (pink) */}
      <div className="bg-lobster text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 text-center text-xs sm:text-sm" suppressHydrationWarning>
          Copyright © {currentYear} Couponro LLC, A System1 Company
        </div>
      </div>
    </footer>
  );
}
