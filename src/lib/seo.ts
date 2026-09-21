// Шаблоны title/description/H1 (раздел 10 ТЗ).
import site from '../data/site.json';

export const seo = {
  product: (name: string) => ({
    h1: name,
    title: `${name}: цена за м³ с доставкой в Москве`,
    description: `${name}. Цена за куб, характеристики, доставка миксером по Москве и области. Отгрузка от ${site.minVolume} м³, паспорт качества на партию.`,
  }),
  grade: (grade: string) => ({
    h1: `Бетон ${grade}`,
    title: `Бетон ${grade}: цена за куб от производителя`,
    description: `Бетон ${grade} с доставкой по Москве и области. Характеристики, класс прочности, цена за м³, расчёт с доставкой.`,
  }),
  klass: (cls: string) => ({
    h1: `Бетон класса ${cls}`,
    title: `Бетон класса ${cls}: цена за куб от производителя`,
    description: `Бетон класса ${cls} с доставкой по Москве и области. Какие марки соответствуют классу, цены и характеристики.`,
  }),
  purpose: (name: string, h1: string) => ({
    h1,
    title: `Бетон для ${name}: какую марку выбрать, цена`,
    description: `Бетон для ${name}: рекомендуемая марка, цена за м³ с доставкой, калькулятор объёма и подбор состава.`,
  }),
  geo: (namePrep: string) => ({
    h1: `Бетон с доставкой в ${namePrep}`,
    title: `Купить бетон в ${namePrep}: цена с доставкой`,
    description: `Доставка бетона в ${namePrep}: расстояние от завода, время в пути, цена за м³ с доставкой, отгрузка от ${site.minVolume} м³.`,
  }),
  category: (name: string, lead: string) => ({
    h1: name,
    title: `${name}: цены за м³ с доставкой в Москве`,
    description: lead,
  }),
};
