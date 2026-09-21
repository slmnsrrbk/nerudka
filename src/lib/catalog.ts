// Группировки каталога: дерево категорий, выборки продуктов, слуги марок и классов.
import categoriesData from '../data/categories.json';
import productsData from '../data/products.json';
import purposesData from '../data/purposes.json';
import type { Category, Product, Purpose } from './types';

export const categories = categoriesData as Category[];
export const products = productsData as Product[];
export const purposes = purposesData as Purpose[];

/** Порядок марок для шкалы S-04. */
export const GRADE_SCALE = ['М100', 'М150', 'М200', 'М250', 'М300', 'М350', 'М400', 'М450', 'М500', 'М550', 'М600'];

export function rootCategories(): Category[] {
  return categories.filter((c) => c.parent === null);
}

export function childCategories(slug: string): Category[] {
  return categories.filter((c) => c.parent === slug);
}

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

/** Путь категории: /catalog/beton/tovarnyj/ */
export function categoryPath(cat: Category): string {
  return cat.parent ? `/catalog/${cat.parent}/${cat.slug}/` : `/catalog/${cat.slug}/`;
}

/**
 * Путь карточки продукта.
 * TODO(вопрос): в ТЗ путь указан как /catalog/{category}/{product}/, но категории
 * вложенные, поэтому используем полный путь родитель/категория/продукт.
 */
export function productPath(product: Product): string {
  const cat = getCategory(product.category);
  if (!cat) return `/catalog/${product.category}/${product.id}/`;
  return `${categoryPath(cat)}${product.id}/`;
}

/** Продукты категории. Для родительской категории собираем из всех дочерних. */
export function productsOfCategory(slug: string): Product[] {
  const children = childCategories(slug).map((c) => c.slug);
  if (children.length) return products.filter((p) => children.includes(p.category));
  return products.filter((p) => p.category === slug);
}

export function categoryBreadcrumbs(cat: Category): { href: string; label: string }[] {
  const trail = [{ href: '/catalog/', label: 'Каталог' }];
  if (cat.parent) {
    const parent = getCategory(cat.parent);
    if (parent) trail.push({ href: categoryPath(parent), label: parent.name });
  }
  trail.push({ href: categoryPath(cat), label: cat.name });
  return trail;
}

export function minPrice(list: Product[]): number {
  return list.length ? Math.min(...list.map((p) => p.price)) : 0;
}

/** «М300» -> «m300» */
export function gradeSlug(grade: string): string {
  return grade.replace(/М/gi, 'm').replace(/\s+/g, '').toLowerCase();
}

/** «B22,5» -> «b22-5» */
export function classSlug(cls: string): string {
  return cls.replace(/В/gi, 'b').replace(/,/g, '-').replace(/\s+/g, '').toLowerCase();
}

/** Марки, у которых есть хотя бы один продукт. */
export function activeGrades(): string[] {
  const set = new Set(products.map((p) => p.grade));
  return GRADE_SCALE.filter((g) => set.has(g));
}

export function activeClasses(): string[] {
  const set = new Set(products.map((p) => p.class).filter(Boolean));
  const order = activeGrades()
    .map((g) => products.find((p) => p.grade === g)?.class)
    .filter((c): c is string => Boolean(c));
  const rest = [...set].filter((c) => !order.includes(c));
  return [...new Set([...order, ...rest])];
}

export function productsByGrade(grade: string): Product[] {
  return products.filter((p) => p.grade === grade);
}

export function productsByClass(cls: string): Product[] {
  return products.filter((p) => p.class === cls);
}

export function productsByPurpose(slug: string): Product[] {
  return products.filter((p) => p.purposes.includes(slug));
}

export function getPurpose(slug: string): Purpose | undefined {
  return purposes.find((p) => p.slug === slug);
}

/** Соседние марки: слабее и прочнее (для блока P-06). */
export function gradeNeighbors(grade: string): { weaker?: Product; stronger?: Product } {
  const active = activeGrades();
  const index = active.indexOf(grade);
  const pick = (g?: string) => (g ? productsByGrade(g)[0] : undefined);
  return {
    weaker: index > 0 ? pick(active[index - 1]) : undefined,
    stronger: index >= 0 && index < active.length - 1 ? pick(active[index + 1]) : undefined,
  };
}

/** Похожие позиции: та же категория, 4 штуки. */
export function similarProducts(product: Product, limit = 4): Product[] {
  const same = products.filter((p) => p.category === product.category && p.id !== product.id);
  if (same.length >= limit) return same.slice(0, limit);
  const others = products.filter((p) => p.category !== product.category && p.grade === product.grade);
  return [...same, ...others].slice(0, limit);
}

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}
