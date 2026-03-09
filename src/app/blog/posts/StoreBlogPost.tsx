import Image from "next/image";
import Link from "next/link";
import type { StoreBlogContent } from "@/lib/store-blog-types";

const IMGS = [
  "/undefined%20(8).png", "/undefined%20(9).png", "/undefined%20(10).png", "/undefined%20(11).png",
  "/img01.jpg", "/img02.jpg", "/img03.jpg", "/img04.jpg", "/img05.jpg", "/img06.jpg", "/img07.jpg", "/img08.jpg", "/img09.jpg", "/img10.jpg",
];

function imageOffset(slug: string): number {
  let n = 0;
  for (let i = 0; i < slug.length; i++) n += slug.charCodeAt(i);
  return Math.abs(n) % Math.max(1, IMGS.length);
}

type Props = { title: string; content: StoreBlogContent; slug?: string };

export default function StoreBlogPost({ title, content, slug = "" }: Props) {
  const { storeName, intro, sections, faqs, ctaLine } = content;
  const offset = imageOffset(slug);

  return (
    <article className="prose prose-slate max-w-none prose-headings:text-space prose-a:text-rebecca prose-a:no-underline hover:prose-a:underline">
      <h1 className="text-3xl sm:text-4xl font-bold text-space mb-6">
        <Link href="/stores">{title}</Link>
      </h1>

      {intro.map((p, i) => (
        <p key={i}>{p}</p>
      ))}

      {sections.map((section, idx) => {
        const imgSrc = IMGS[(offset + idx) % IMGS.length];
        const listItems = section.listItems;
        const hasTitleText = listItems?.length && typeof listItems[0] === "object" && listItems[0] !== null && "title" in (listItems[0] as object);

        return (
          <div key={idx}>
            <figure className="my-8">
              <Image
                src={imgSrc}
                alt={`${storeName} deals and savings`}
                width={1000}
                height={660}
                className="rounded-2xl w-full object-cover"
                unoptimized
              />
            </figure>
            <h2 className="text-2xl font-bold text-space mt-10 mb-4">
              <Link href="/stores">{section.heading}</Link>
            </h2>
            {section.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {listItems && listItems.length > 0 && (
              <ul>
                {hasTitleText
                  ? (listItems as { title: string; text: string }[]).map((item, i) => (
                      <li key={i}>
                        <strong>{item.title}:</strong> {item.text}
                      </li>
                    ))
                  : (listItems as string[]).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
              </ul>
            )}
          </div>
        );
      })}

      <h2 className="text-2xl font-bold text-space mt-10 mb-4">
        <Link href="/stores">Final Verdict</Link>
      </h2>
      <p>
        With the right {storeName} coupon codes and deals, you can shop smarter and save more.
        Keep this guide handy and check <Link href="/stores">Couponro</Link> for the latest {storeName} offers.
      </p>
      <p>
        Don&apos;t overpay—grab the latest {storeName} promo codes and save on your next order. {ctaLine}
      </p>

      <h2 className="text-2xl font-bold text-space mt-10 mb-4">
        <Link href="/coupons">FAQs</Link>
      </h2>
      <dl className="space-y-4">
        {faqs.map((faq, i) => (
          <div key={i}>
            <dt className="font-bold text-space">{i + 1}. {faq.q}</dt>
            <dd>{faq.a}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
