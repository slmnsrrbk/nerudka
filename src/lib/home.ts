// Данные итоговой главной (дизайн «3», П8 после правок заказчика).
import { categories, products, childCategories, productPath, categoryPath, minPrice } from './catalog';
import type { Product } from './types';

export const fmt = (n: number) => n.toLocaleString('ru-RU').replace(/ /g, ' ');
export const rub = (n: number) => `${fmt(n)} ₽`;

export type PriceCell = { id: string; price: number; href: string; name: string };
export type PriceRow = { title: string; sub: string; cells: (PriceCell | null)[] };
export type PriceTab = {
  slug: string; name: string; group: 'beton' | 'rastvor'; min: number; count: number;
  note: string; columns: string[]; rows: PriceRow[]; href: string;
};

const cell = (p: Product): PriceCell => ({ id: p.id, price: p.price, href: productPath(p), name: p.name });

function sub(p: Product): string {
  return [p.class || p.density, p.mobility, p.frost].filter(Boolean).slice(0, 2).join(' · ');
}

const gradeOrder = (g: string) => parseInt(g.replace(/\D/g, ''), 10) || 0;

export function priceTabs(): PriceTab[] {
  const tabs: PriceTab[] = [];
  for (const group of ['beton', 'rastvor'] as const) {
    for (const cat of childCategories(group)) {
      const items = products.filter((p) => p.category === cat.slug);
      if (!items.length) continue;
      const fillers = new Set(items.map((p) => p.filler));
      const two = fillers.has('гравий') && fillers.has('гранит');
      const gost = [...new Set(items.map((p) => p.gost).filter(Boolean))][0] ?? '';
      const mob = [...new Set(items.map((p) => p.mobility).filter(Boolean))];
      let rows: PriceRow[];
      if (two) {
        const grades = [...new Set(items.map((p) => p.grade))].sort((a, b) => gradeOrder(a) - gradeOrder(b));
        rows = grades.map((g) => {
          const gr = items.find((p) => p.grade === g && p.filler === 'гравий');
          const gn = items.find((p) => p.grade === g && p.filler === 'гранит');
          const any = (gr ?? gn)!;
          const base = cat.name.replace(/ бетон$/, '');
          return {
            title: cat.slug === 'tovarnyj' ? `Бетон ${g}` : `${base} ${g}`,
            sub: [any.class || any.density, any.mobility].filter(Boolean).join(' · '),
            cells: [gr ? cell(gr) : null, gn ? cell(gn) : null],
          };
        });
      } else {
        rows = items.slice().sort((a, b) => gradeOrder(a.grade) - gradeOrder(b.grade) || a.price - b.price)
          .map((p) => ({ title: p.name, sub: sub(p), cells: [cell(p)] }));
      }
      tabs.push({
        slug: cat.slug, name: cat.name, group, min: minPrice(items), count: items.length,
        note: [`${items.length} ${plural(items.length, 'позиция', 'позиции', 'позиций')}`, gost, mob.length === 1 ? `подвижность ${mob[0]}` : ''].filter(Boolean).join(' · '),
        columns: two ? ['На гравии · за м³', 'На граните · за м³'] : ['Цена · за м³'],
        rows, href: categoryPath(cat),
      });
    }
  }
  return tabs;
}

export function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}

/** Индекс поиска по шапке: виды продукции и позиции прайса. */
export function searchIndex() {
  return [
    ...categories.filter((c) => c.parent).map((c) => ({ t: c.name, h: categoryPath(c), k: 'Раздел', p: minPrice(products.filter((p) => p.category === c.slug)) })),
    ...products.map((p) => ({ t: p.name, h: productPath(p), k: [p.class, p.mobility].filter(Boolean).join(' · '), p: p.price })),
  ];
}

export const minFactoryPrice = () => Math.min(...products.map((p) => p.price));

export const DISCOUNTS = [
  { from: 500, percent: 20 },
  { from: 200, percent: 15 },
  { from: 50, percent: 10 },
];

export const PLANTS = [1, 2, 3, 4, 5, 6].map((n, i) => {
  const set = ['plant-dosing', 'plant-silos', 'plant-aggregates', 'plant-mixers', 'plant-inside', 'hero', 'plant-pour', 'lab-press'];
  const photos = [0, 1, 2, 3, 4].map((k) => set[(i + k) % set.length]);
  return { n, name: `Бетонный узел № ${n}`, address: '[адрес — заглушка]', power: '[заглушка] м³/ч', mode: 'Отгрузка круглосуточно', photos };
});

export const OBJECTS = [
  { slug: 'zhk-severnyj-park', name: 'ЖК «Северный парк», три корпуса', grade: 'М350 В25 W8', volume: '12 400 м³', tech: 'Миксеры 9 и 12 м³, АБН 52 м', period: 'Март 2025 — январь 2026', review: '«Ни одного срыва графика за десять месяцев. Документы приходят с машиной, не приходится напоминать.»', img: 'obj-zhk' },
  { slug: 'kottedzhnyj-poselok-lesnoj', name: 'Коттеджный посёлок «Лесной», 46 домов', grade: 'М250 В20, М300 В22,5', volume: '3 200 м³', tech: 'Миксеры 9 и 12 м³', period: 'Апрель — ноябрь 2025', review: '[Отзыв заказчика — заглушка]', img: 'obj-cottage' },
  { slug: 'chastnyj-dom-420', name: 'Частный дом 420 м²', grade: 'М300 В22,5', volume: '310 м³', tech: 'Миксеры 9 м³, АБН 42 м', period: 'Май — август 2025', review: '«Плиту залили за день, шов не понадобился. Насос приехал вовремя, простоя не было.»', img: 'obj-slab' },
  { slug: 'logisticheskij-kompleks', name: 'Логистический комплекс на Новорижском шоссе', grade: 'М350 В25, фибробетон', volume: '8 900 м³', tech: 'Миксеры 12 м³, АБН 42 м', period: 'Май — октябрь 2025', review: '[Отзыв заказчика — заглушка]', img: 'floor-pour' },
  { slug: 'rekonstrukciya-putepovoda', name: 'Реконструкция путепровода', grade: 'М400 В30 W10 F300', volume: '1 850 м³', tech: 'Миксеры 9 м³, АБН 36 м, круглосуточная подача', period: 'Июнь — сентябрь 2025', review: '[Отзыв заказчика — заглушка]', img: 'columns' },
  { slug: 'skladskoj-terminal', name: 'Складской терминал', grade: 'Тощий бетон М150, М350 В25', volume: '5 600 м³', tech: 'Миксеры 12 м³, самосвалы', period: 'Февраль — июль 2025', review: '[Отзыв заказчика — заглушка]', img: 'm300-slab' },
];

export const FAQ = [
  ['От какого объёма возите?', 'От 1 м³. Доставку считаем по зоне — от 400 ₽ за м³, разгрузка до 60 минут бесплатно.'],
  ['Как быстро привезёте?', 'Заявка до 12:00 — бетон сегодня. Машина идёт с ближайшего из шести узлов.'],
  ['Какие документы даёте?', 'Паспорт качества на каждую партию, весовую распечатку, УПД через ЭДО.'],
  ['Работаете с юрлицами?', 'Да, по договору. Постоянным клиентам — отсрочка до 30 дней.'],
  ['Не знаю, какая марка нужна', 'Посмотрите калькулятор или напишите технологу — подскажем марку по конструкции.'],
  ['Можно приехать на узел?', 'Да, приезжайте на отгрузку в любой день. Адреса — в «Данных о заводах».'],
  ['Можно заливать зимой?', 'Да, до −25 °C: противоморозные добавки и прогрев — от 350 ₽ за м³.'],
  ['Сколько брать с запасом?', 'Считаем объём с запасом 5 %. Условия дозаказа, если не хватило, — [заглушка].'],
  ['Можно забрать самому? Есть скидки?', 'Да: цены в прайсе — на условиях самовывоза. От 50 м³ — скидка 10 %, от 200 — 15 %, от 500 — 20 %.'],
];

export const TIPS = [
  { t: 'Не хватило бетона — что делать', d: 'Как избежать холодного шва и когда дозаказывать', h: '/blog/skolko-betona-nuzhno/', img: 'plant-mixers' },
  { t: 'Как принять бетон на объекте', d: 'Что проверить в паспорте и накладной до разгрузки', h: '/blog/priemka-betona/', img: 'expert' },
  { t: 'Заливка зимой', d: 'Противоморозные добавки и прогрев до −25 °C', h: '/blog/zimnee-betonirovanie/', img: 'plant-silos' },
  { t: 'Гравий или гранит', d: 'Когда стоит доплатить за гранит', h: '/blog/gravij-ili-granit/', img: 'plant-aggregates' },
];
