// Данные и помощники внутренних страниц (Figma «Внутренние страницы · после правок»).
import { categories, products, childCategories, categoryPath, productPath, getCategory, minPrice, purposes, productsOfCategory, activeGrades, activeClasses, gradeSlug, classSlug, GRADE_SCALE } from './catalog';
import type { Category, Product } from './types';
import { fmt, plural } from './home';

export const img = (name: string, w = 1024) => `/img/home/${name}${w <= 560 ? '-560' : ''}.webp`;

/** Фото карточки по виду продукции: одно правило на весь каталог. */
const PHOTO: Record<string, string> = {
  tovarnyj: 'plant-mixers', toshchij: 'plant-aggregates', melkozernistyj: 'floor-pour', keramzitobeton: 'keramzit',
  peskobeton: 'm300-slab', fibrobeton: 'floor-pour', gidrotehnicheskij: 'columns', dorozhnyj: 'mixer-road',
  mostovoj: 'columns', legkij: 'keramzit', polistirolbeton: 'keramzit', morozostojkij: 'plant-silos',
  sulfatostojkij: 'columns', bezdobavochnyj: 'plant-dosing', teplyj: 'keramzit',
  cps: 'plant-aggregates', bss: 'plant-aggregates', 'kladochnaya-smes': 'mortar',
};
export function productPhoto(p: Product): string {
  if (p.category === 'tovarnyj') return p.filler === 'гранит' ? 'mixer-site' : 'plant-mixers';
  return PHOTO[p.category] ?? 'mortar';
}

const FILLER_PREP: Record<string, string> = { гравий: 'на гравии', гранит: 'на граните' };
/** Надпись на фото карточки: марка крупно и вид продукции. */
export function photoLabel(p: Product): { big: string; small: string } {
  const cat = getCategory(p.category);
  const big = p.grade || p.density || (cat?.name.split(' ')[0] ?? '');
  let small = (cat?.name ?? '').toLowerCase();
  if (p.category === 'tovarnyj') small = `бетон ${FILLER_PREP[p.filler] ?? ''}`.trim();
  return { big, small };
}

export const specLine = (p: Product) => [p.class || p.density, p.mobility, p.frost, p.water].filter(Boolean).join(' · ');

/** «Самые популярные виды бетона» — позиции с бейджем «Хит». */
export function popular(): Product[] {
  const hits = products.filter((p) => p.badges?.includes('Хит'));
  const order = ['beton-m300-gravij', 'beton-m300-granit', 'beton-m200-gravij'];
  return hits.sort((a, b) => ((order.indexOf(a.id) + 1) || 9) - ((order.indexOf(b.id) + 1) || 9)).slice(0, 4);
}

export type TypeCard = { name: string; href: string; count: string; from: string; slug: string };
export function typeCards(parent: string): TypeCard[] {
  return childCategories(parent).map((c) => {
    const items = products.filter((p) => p.category === c.slug);
    return { name: c.name, href: categoryPath(c), slug: c.slug, count: `${items.length} ${plural(items.length, 'позиция', 'позиции', 'позиций')}`, from: `от ${fmt(minPrice(items))} ₽` };
  }).filter((t) => !t.count.startsWith('0 '));
}

export const crumbsFor = (cat: Category) => {
  const trail: { href?: string; label: string }[] = [{ href: '/', label: 'Главная' }, { href: '/catalog/', label: 'Каталог' }];
  // Уровень «Бетон» в крошках не показываем: бетон — это и есть главная страница сайта (правки заказчика).
  if (cat.parent && cat.parent !== 'beton') { const p = getCategory(cat.parent); if (p) trail.push({ href: categoryPath(p), label: p.name }); }
  trail.push({ label: cat.name });
  return trail;
};

export const ZONES = [['До 10 км', 400], ['10–20 км', 550], ['20–35 км', 700], ['35–50 км', 900]] as const;

/** Строки списка позиций: группы по разделу (бетон / растворы). */
export type RowGroup = { title?: string; href?: string; items: Product[] };
export function groupByRoot(items: Product[]): RowGroup[] {
  return ['beton', 'rastvor'].map((root) => {
    const cat = getCategory(root)!;
    const kids = new Set(childCategories(root).map((c) => c.slug));
    return { title: cat.name, href: categoryPath(cat), items: items.filter((p) => kids.has(p.category)).sort(byGrade) };
  }).filter((g) => g.items.length);
}
export const gradeNum = (g: string) => GRADE_SCALE.indexOf(g);
export const byGrade = (a: Product, b: Product) => gradeNum(a.grade) - gradeNum(b.grade) || a.price - b.price;

/** Марки товарного бетона (чипы соседних страниц, облако ссылок). */
export const betonGrades = () => GRADE_SCALE.filter((g) => products.some((p) => p.category === 'tovarnyj' && p.grade === g));
export const betonClasses = () => [...new Set(betonGrades().map((g) => products.find((p) => p.category === 'tovarnyj' && p.grade === g)!.class).filter(Boolean))];
export const gradeHref = (g: string) => `/beton/${gradeSlug(g)}/`;
export const classHref = (c: string) => `/beton/klass-${classSlug(c)}/`;
export const purposeHref = (slug: string) => `/beton/dlya-${slug}/`;
export const purposeLabel = (h1: string) => h1.replace(/^Бетон /, '').replace(/^./, (c) => c.toUpperCase());

/** «Все подкатегории бетона»: марки, классы, заполнитель, назначение, виды. */
export function linkCloud() {
  const tov = childCategories('beton');
  return [
    { t: 'Марки', links: betonGrades().map((g) => ({ label: g, href: gradeHref(g) })) },
    { t: 'Классы', links: betonClasses().map((c) => ({ label: c, href: classHref(c) })) },
    { t: 'Заполнитель', links: [
      { label: 'Бетон на гравии', href: '/catalog/beton/tovarnyj/' }, { label: 'Бетон на граните', href: '/catalog/beton/tovarnyj/' },
      ...['keramzitobeton', 'melkozernistyj', 'peskobeton'].map((s) => getCategory(s)!).map((c) => ({ label: c.name, href: categoryPath(c) })),
    ] },
    { t: 'Назначение', links: purposes.map((p) => ({ label: purposeLabel(p.h1), href: purposeHref(p.slug) })) },
    { t: 'Виды', links: tov.filter((c) => productsOfCategory(c.slug).length).map((c) => ({ label: c.name.replace(/ бетон$/, ''), href: categoryPath(c) })) },
  ];
}

/** Услуги на странице каталога: ссылки ведут к ценам услуг в прайсе, к доставке на главной и к документам. */
export const SERVICE_GROUPS = [
  { t: 'Бетононасосы', links: [['Аренда бетононасоса', '/price/#arenda-betononasosa']] },
  { t: 'Прогрев бетона', links: [['Прогрев бетона зимой', '/price/#progrev-betona']] },
  { t: 'Поставка', links: [['Бетон с доставкой', '/price/#dostavka-mikserom'], ['Доставка по Москве и области', '/#delivery']] },
  { t: 'Лаборатория и контроль', links: [['Лабораторные испытания бетона', '/price/#laboratornye-ispytaniya'], ['Сертификаты и документы', '/o-zavode/#docs']] },
] as const;


export { activeGrades, activeClasses, gradeSlug, classSlug, GRADE_SCALE };
export { categories, products, purposes, productPath, categoryPath, getCategory, childCategories, minPrice, fmt, plural, productsOfCategory };

/** SEO-описание позиции для блока «Описание» — собирается только из данных позиции, без выдуманных фактов. */
export function productDescription(p: Product): string[] {
  const cat = getCategory(p.category);
  const used = p.purposes.map((s) => purposes.find((x) => x.slug === s)?.name).filter(Boolean) as string[];
  const params = [p.class && `класс прочности ${p.class}`, p.mobility && `подвижность ${p.mobility}`, p.frost && `морозостойкость ${p.frost}`, p.water && `водонепроницаемость ${p.water}`, p.density && `марка по плотности ${p.density}`].filter(Boolean);
  const filler = p.filler ? ` на ${p.filler === 'гравий' ? 'гравийном' : p.filler === 'гранит' ? 'гранитном' : p.filler} ${['гравий', 'гранит'].includes(p.filler) ? 'щебне' : 'заполнителе'}${p.fraction ? ` фракции ${p.fraction.replace('-', '–')} мм` : ''}` : '';
  const out = [
    `${p.name} — ${(cat?.name ?? '').toLowerCase()}${filler}${p.gost ? ` по ${p.gost}` : ''}. ${params.length ? `Основные параметры смеси: ${params.join(', ')}.` : ''}`.trim(),
  ];
  if (cat?.lead) out.push(cat.lead);
  if (used.length) out.push(`Применяют для ${used.join(', ')}. Марку и класс для конкретной конструкции подтверждают по проекту.`);
  if (p.note) out.push(p.note);
  out.push(`Цена — ${fmt(p.price)} ₽ за м³ с завода. Отгружаем с ближайшего из шести РБУ в Москве и области, с каждой машиной — паспорт качества и весовая распечатка. Доставка от 400 ₽ за м³, от 50 м³ — скидка 10 %.`);
  return out;
}
