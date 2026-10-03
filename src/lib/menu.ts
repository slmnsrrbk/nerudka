// Меню «Продукция» по семантическому дереву заказчика (XMind «Бетон от производителя»).
// Ссылки ведут на существующие страницы прототипа; где страницы пока нет — на ближайший раздел.
import { categories, categoryPath, activeGrades, activeClasses, gradeSlug, classSlug, purposes } from './catalog';
import services from '../data/services.json';

export type MenuLink = { label: string; href: string };
export type MenuGroup = { title: string; kind: 'chips' | 'list'; items: MenuLink[]; all?: MenuLink };
export type MenuSection = { id: string; label: string; icon: string; columns: MenuGroup[][]; footer: MenuLink[] };

const CATALOG_BETON = '/catalog/beton/';
const CATALOG_RASTVOR = '/catalog/rastvor/';

const norm = (s: string) =>
  s.toLowerCase().replace(/ё/g, 'е').replace(/[()«»"]/g, '').replace(/\s+/g, ' ').trim();

function categoryHref(name: string, fallback: string): string {
  const n = norm(name);
  const cat = categories.find((c) => norm(c.name) === n || norm(c.name).startsWith(n) || n.startsWith(norm(c.name)));
  return cat ? categoryPath(cat) : fallback;
}

const grades = new Set(activeGrades());
function gradeHref(grade: string): string {
  return grades.has(grade) ? `/beton/${gradeSlug(grade)}/` : `${CATALOG_BETON}?grade=${encodeURIComponent(grade)}`;
}

// В дереве классы записаны как «В22.5» (кириллица, точка), в данных — «B22,5».
const classes = activeClasses();
function classHref(label: string): string {
  const key = label.replace(/В/g, 'B').replace('.', ',');
  return classes.includes(key) ? `/beton/klass-${classSlug(key)}/` : CATALOG_BETON;
}

function purposeHref(label: string): string {
  const n = norm(label).replace(/^бетон /, '').replace(/^для /, '');
  const p = purposes.find((x) => norm(x.name) === n || n.startsWith(norm(x.name)));
  if (p) return `/beton/dlya-${p.slug}/`;
  if (n.startsWith('аэродром')) return '/beton/dlya-aerodromnyj/';
  return CATALOG_BETON;
}

function serviceHref(label: string): string {
  const n = norm(label);
  const s = (services as { slug: string; name: string }[]).find((x) => {
    const sn = norm(x.name);
    return sn === n || (n.includes('бетононасос') && sn.includes('бетононасос') && !n.includes('стационар') && !n.includes('керамзит'))
      || (n.startsWith('прогрев') && sn.startsWith('прогрев'))
      || (n.includes('лаборатор') && sn.includes('лаборатор'))
      || (n === 'бетон с доставкой' && sn.includes('доставка'));
  });
  return s ? `/uslugi/${s.slug}/` : '/uslugi/';
}

const BETON_GRADES = ['М50', 'М100', 'М150', 'М200', 'М250', 'М300', 'М350', 'М400', 'М450', 'М500', 'М550', 'М600', 'М700', 'М800', 'М1000'];
const BETON_CLASSES = ['В3.5', 'В7.5', 'В10', 'В12.5', 'В15', 'В20', 'В22.5', 'В25', 'В30', 'В35', 'В40', 'В45', 'В60'];
const FILLERS = [
  { label: 'Бетон на гравии', href: `${CATALOG_BETON}tovarnyj/?filler=${encodeURIComponent('гравий')}` },
  { label: 'Бетон на граните', href: `${CATALOG_BETON}tovarnyj/?filler=${encodeURIComponent('гранит')}` },
  { label: 'Керамзитобетон', href: categoryHref('Керамзитобетон', CATALOG_BETON) },
  { label: 'Мелкозернистый бетон', href: categoryHref('Мелкозернистый бетон', CATALOG_BETON) },
  { label: 'Пескобетон', href: categoryHref('Пескобетон', CATALOG_BETON) },
  { label: 'Бетон с гранитной крошкой', href: CATALOG_BETON },
];
const TYPES = ['Товарный бетон', 'Тяжёлый бетон', 'Тощий бетон', 'Лёгкий бетон', 'Фибробетон', 'Гидротехнический бетон', 'Мостовой бетон',
  'Полистиролбетон', 'Морозостойкий бетон', 'Бездобавочный бетон', 'Сульфатостойкий бетон', 'Дорожный бетон', 'Тёплый бетон'];
const PURPOSES = ['Для фундамента', 'Для ленточного фундамента', 'Для плитного фундамента', 'Для стяжки пола', 'Для отмостки', 'Для гаража', 'Аэродромный бетон'];

const MIXES = ['Цементно-песчаная смесь (ЦПС)', 'Сухая бетонная смесь (БСС)', 'Кладочная смесь'];
const CPS_GRADES = ['М50', 'М75', 'М100', 'М150', 'М200', 'М250', 'М300', 'М350', 'М400'];
const MORTARS = ['Цементно-песчаный раствор (ЦПР)', 'Цементный раствор', 'Штукатурный раствор', 'Кладочный раствор', 'Известковый раствор',
  'Цементно-известковый раствор', 'Раствор для стяжки пола', 'Цементное молочко'];
const MORTAR_GRADES = ['М25', 'М50', 'М75', 'М100', 'М150', 'М200', 'М250', 'М300'];

const list = (labels: string[], href: (l: string) => string): MenuLink[] => labels.map((label) => ({ label, href: href(label) }));
const short = (l: string) => l.replace(/ бетон$/, '');
// «Товарный», «Тощий» без слова «бетон» читаются хуже — оставляем полностью.
const KEEP_FULL = new Set(['Товарный бетон', 'Тяжёлый бетон', 'Тощий бетон', 'Лёгкий бетон', 'Тёплый бетон']);

export const MENU: MenuSection[] = [
  {
    id: 'beton', label: 'Бетон', icon: 'layers',
    columns: [
      [
        { title: 'По марке', kind: 'chips', items: list(BETON_GRADES, gradeHref) },
        { title: 'По классу', kind: 'chips', items: BETON_CLASSES.map((c) => ({ label: c.replace('.', ','), href: classHref(c) })) },
      ],
      [
        { title: 'По заполнителю', kind: 'list', items: FILLERS },
        { title: 'По назначению', kind: 'list', items: list(PURPOSES, purposeHref) },
      ],
      [
        { title: 'По типу и виду', kind: 'list', items: TYPES.map((t) => ({ label: KEEP_FULL.has(t) ? t : short(t), href: categoryHref(t, CATALOG_BETON) })) },
      ],
    ],
    footer: [{ label: 'Весь каталог бетона', href: CATALOG_BETON }, { label: 'Прайс-лист', href: '#price' }],
  },
  {
    id: 'rastvor', label: 'Растворы и смеси', icon: 'cylinder',
    columns: [
      [
        { title: 'Смеси', kind: 'list', items: list(MIXES, (l) => categoryHref(l, CATALOG_RASTVOR)) },
        { title: 'ЦПС по марке', kind: 'chips', items: CPS_GRADES.map((g) => ({ label: g, href: categoryHref('Цементно-песчаная смесь (ЦПС)', CATALOG_RASTVOR) })) },
      ],
      [{ title: 'Растворы', kind: 'list', items: list(MORTARS, (l) => categoryHref(l, CATALOG_RASTVOR)) }],
      [
        { title: 'Раствор по марке', kind: 'chips', items: MORTAR_GRADES.map((g) => ({ label: g, href: `${CATALOG_RASTVOR}?grade=${encodeURIComponent(g)}` })) },
        { title: 'Подвижность', kind: 'chips', items: [{ label: 'Пк 1–4', href: categoryHref('Цементный раствор', CATALOG_RASTVOR) }] },
      ],
    ],
    footer: [{ label: 'Все растворы и смеси', href: CATALOG_RASTVOR }, { label: 'Прайс-лист', href: '#price' }],
  },
  {
    id: 'uslugi', label: 'Услуги', icon: 'hard-hat',
    columns: [
      [
        { title: 'Бетононасосы', kind: 'list', items: list(['Аренда бетононасоса', 'Аренда стационарного бетононасоса', 'Пневмонагнетатель', 'Бетононасос для керамзитобетона'], serviceHref) },
        { title: 'Поставка', kind: 'list', items: list(['Бетон оптом', 'Бетон с доставкой'], serviceHref) },
      ],
      [{ title: 'Прогрев бетона', kind: 'list', items: [
        { label: 'Прогрев бетона', href: serviceHref('Прогрев бетона') },
        { label: 'Термоматами', href: serviceHref('Прогрев бетона') },
        { label: 'Электродами', href: serviceHref('Прогрев бетона') },
        { label: 'Проводом ПНСВ', href: serviceHref('Прогрев бетона') },
        { label: 'Методом «Тепляк»', href: serviceHref('Прогрев бетона') },
      ] }],
      [{ title: 'Работы и контроль', kind: 'list', items: list(['Фундамент под ключ', 'Бетонирование площадки', 'Промышленные полы', 'Бетонные полы для склада и паркинга', 'Строительная лаборатория', 'Строительный контроль'], serviceHref) }],
    ],
    footer: [{ label: 'Все услуги', href: '/uslugi/' }, { label: 'Заказать консультацию', href: '#consult' }],
  },
];

export const NAV: MenuLink[] = [
  { label: 'Прайс-лист', href: '#price' },
  { label: 'О компании', href: '/o-zavode/' },
  { label: 'Завод', href: '#plants' },
  { label: 'Калькулятор', href: '#calc' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Контакты', href: '#contacts' },
];
