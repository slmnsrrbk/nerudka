export type Product = {
  id: string;
  category: string;
  name: string;
  grade: string;
  class: string;
  mobility: string;
  frost: string;
  water: string;
  density: string;
  filler: string;
  fraction: string;
  gost: string;
  price: number;
  badges: string[];
  purposes: string[];
  note: string;
  faq: { q: string; a: string }[];
};

export type Category = {
  slug: string;
  parent: string | null;
  name: string;
  type?: string;
  lead: string;
};

export type Zone = { id: string; name: string; pricePerM3: number; maxKm: number };

export type Geo = {
  slug: string;
  name: string;
  namePrep: string;
  group: 'moscow' | 'new-moscow' | 'mo';
  okrug?: string;
  distanceKm: number;
  travelMin: number;
  zone: string;
  neighbors: string[];
};

export type Purpose = {
  slug: string;
  name: string;
  h1: string;
  recommended: string;
  short: string;
  calcShape: 'strip' | 'slab' | 'columns';
  tip: string;
};

export type Service = {
  slug: string;
  name: string;
  priceFrom: number;
  priceUnit: string;
  lead: string;
  includes: string[];
  tech: { boom: string; reach: string; perf: string; price: number }[];
  terms: string[];
  faqScope: string;
};

export type FaqItem = { scope: string; q: string; a: string };
