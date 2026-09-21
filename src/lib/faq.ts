import faqData from '../data/faq.json';
import type { FaqItem } from './types';

export const faqItems = faqData as FaqItem[];

export function faqByScope(scope: string, limit?: number): FaqItem[] {
  const list = faqItems.filter((f) => f.scope === scope);
  return limit ? list.slice(0, limit) : list;
}

export const FAQ_GROUPS = [
  { scope: 'order', title: 'Заказ и оплата' },
  { scope: 'delivery', title: 'Доставка' },
  { scope: 'quality', title: 'Качество и документы' },
  { scope: 'marks', title: 'Марки и выбор' },
  { scope: 'pump', title: 'Насос и услуги' },
  { scope: 'product', title: 'Про смеси' },
  { scope: 'category', title: 'Общие вопросы по каталогу' },
  { scope: 'geo', title: 'География доставки' },
];
