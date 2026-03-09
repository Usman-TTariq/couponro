import Image from "next/image";
import Link from "next/link";

const IMGS = ["/img07.jpg", "/img05.jpg", "/img31.jpg"];

export default function DealsGuidePost() {
  return (
    <article className="prose prose-slate max-w-none prose-headings:text-space prose-a:text-rebecca prose-a:no-underline hover:prose-a:underline">
      <h1 className="text-3xl sm:text-4xl font-bold text-space mb-6">
        <Link href="/coupons">Top Deals &amp; Coupon Codes (Best Offers Guide 2026)</Link>
      </h1>

      <p>
        The best deals are the ones that actually work at checkout. This guide rounds up top
        deals and verified coupon codes in 2026—so you can pay less on electronics, fashion, home,
        and everyday shopping without wasting time on expired or fake codes.
      </p>
      <p>
        We focus on current offers you can use today. Check our <Link href="/coupons">Coupons</Link>{" "}
        page for the latest codes and filter by store or category to find the right deal for you.
      </p>

      <figure className="my-8">
        <Image
          src={IMGS[0]}
          alt="Top deals and coupon codes"
          width={1000}
          height={660}
          className="rounded-2xl w-full object-cover"
          unoptimized
        />
      </figure>

      <h2 className="text-2xl font-bold text-space mt-10 mb-4">
        <Link href="/coupons">Why Use Verified Deals</Link>
      </h2>
      <figure className="my-6">
        <Image
          src={IMGS[1]}
          alt="Verified promo codes that work at checkout"
          width={1000}
          height={660}
          className="rounded-2xl w-full object-cover"
          unoptimized
        />
      </figure>
      <p>
        Not every &quot;deal&quot; you see online works. We verify and update our coupon codes so you
        don&apos;t hit a dead end at checkout. Using verified deals saves you time and ensures you
        actually get the discount.
      </p>

      <h2 className="text-2xl font-bold text-space mt-10 mb-4">
        <Link href="/coupons">Types of Deals You&apos;ll Find</Link>
      </h2>
      <figure className="my-6">
        <Image
          src={IMGS[2]}
          alt="Percentage off, free shipping, and more"
          width={1000}
          height={660}
          className="rounded-2xl w-full object-cover"
          unoptimized
        />
      </figure>
      <p>Common deal types on Couponro:</p>
      <ul>
        <li><strong>Percentage off:</strong> 10%, 20%, or more off your order with a single code.</li>
        <li><strong>Dollar off:</strong> Fixed discount (e.g. $10 off $50) for a minimum spend.</li>
        <li><strong>Free shipping:</strong> Codes or thresholds that waive delivery—see our <Link href="/freeshipping">Free Shipping</Link> page.</li>
        <li><strong>Category &amp; seasonal:</strong> Back-to-school, Black Friday, and store-specific sales.</li>
      </ul>

      <h2 className="text-2xl font-bold text-space mt-10 mb-4">
        <Link href="/coupons">How to Use a Coupon Code</Link>
      </h2>
      <p>
        Copy the code from our <Link href="/coupons">Coupons</Link> or store page, add items to your
        cart, and at checkout paste it into the promo or discount code box. If it doesn&apos;t
        apply, check the terms (minimum order, exclusions) or try the next code—we list several per
        store when available.
      </p>

      <h2 className="text-2xl font-bold text-space mt-10 mb-4">
        <Link href="/coupons">Final Verdict</Link>
      </h2>
      <p>
        Don&apos;t overpay. Browse <Link href="/coupons">Couponro&apos;s deals</Link> before you buy,
        use a verified code at checkout, and combine with <Link href="/freeshipping">free
        shipping</Link> when you can. Small steps add up to real savings in 2026.
      </p>

      <h2 className="text-2xl font-bold text-space mt-10 mb-4">FAQs</h2>
      <dl className="space-y-4">
        <div>
          <dt className="font-bold text-space">1. Are these deals really current?</dt>
          <dd>We update and remove expired codes regularly. If a code doesn&apos;t work, check the offer terms or try another listed for that store.</dd>
        </div>
        <div>
          <dt className="font-bold text-space">2. Can I stack multiple coupon codes?</dt>
          <dd>Most stores allow one promo code per order. Some let you combine a code with in-cart or membership offers—see the store&apos;s terms.</dd>
        </div>
        <div>
          <dt className="font-bold text-space">3. Where do I enter the code?</dt>
          <dd>At checkout, look for &quot;Promo code&quot;, &quot;Discount code&quot;, or &quot;Gift cards &amp; promotional codes&quot; and paste the code there.</dd>
        </div>
      </dl>
    </article>
  );
}
