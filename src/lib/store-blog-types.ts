export type StoreBlogSection = {
  heading: string;
  paragraphs: string[];
  listItems?: { title: string; text: string }[] | string[];
};

export type StoreBlogFAQ = { q: string; a: string };

export type StoreBlogContent = {
  storeName: string;
  intro: string[];
  sections: StoreBlogSection[];
  faqs: StoreBlogFAQ[];
  ctaLine: string; // e.g. "simply head to Couponro today!"
};
