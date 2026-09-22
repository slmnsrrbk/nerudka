// Карта маршрутов прототипа. Используется страницей /_prototype/.
import { categories, products, categoryPath, productPath, activeGrades, activeClasses, gradeSlug, classSlug, purposes } from './catalog';
import { geoPoints, geoPath } from './geo';
import servicesData from '../data/services.json';
import projects from '../data/projects.json';
import posts from '../data/posts.json';
import promos from '../data/promos.json';
import pagesData from '../data/pages.json';
import type { Service } from './types';

export type RouteGroup = { title: string; template: string; routes: { href: string; label: string }[] };

export const TEMPLATES: { id: string; name: string; example: string }[] = [
  { id: 'T00', name: 'Карта прототипа', example: '/_prototype/' },
  { id: 'T01', name: 'Главная', example: '/' },
  { id: 'T02', name: 'Хаб (каталог, услуги)', example: '/catalog/' },
  { id: 'T03', name: 'Категория каталога', example: '/catalog/beton/tovarnyj/' },
  { id: 'T04', name: 'Карточка продукта', example: '/catalog/beton/tovarnyj/beton-m300-granit/' },
  { id: 'T05', name: 'SEO-посадка', example: '/beton/m300/' },
  { id: 'T06', name: 'Услуга', example: '/uslugi/arenda-betononasosa/' },
  { id: 'T07a', name: 'Доставка', example: '/dostavka/' },
  { id: 'T07', name: 'Гео-страница', example: '/dostavka/odincovo/' },
  { id: 'T08', name: 'Прайс', example: '/price/' },
  { id: 'T09', name: 'Калькулятор', example: '/calculator/' },
  { id: 'T10', name: 'Контентная страница', example: '/o-zavode/' },
  { id: 'T11', name: 'Сертификаты и документы', example: '/sertifikaty/' },
  { id: 'T12', name: 'Проекты, список', example: '/proekty/' },
  { id: 'T13', name: 'Проект', example: '/proekty/zhk-severnyj-park/' },
  { id: 'T14', name: 'Отзывы', example: '/otzyvy/' },
  { id: 'T15', name: 'Список публикаций', example: '/blog/' },
  { id: 'T16', name: 'Публикация', example: '/blog/kak-vybrat-marku-betona/' },
  { id: 'T17', name: 'Вопросы и ответы', example: '/faq/' },
  { id: 'T18', name: 'Контакты', example: '/kontakty/' },
  { id: 'T19', name: 'Текстовая страница', example: '/politika/' },
  { id: 'T20', name: 'Страница не найдена', example: '/404.html' },
];

export function routeGroups(): RouteGroup[] {
  const services = servicesData as Service[];
  return [
    { title: 'Главная', template: 'T01', routes: [{ href: '/', label: 'Главная' }] },
    {
      title: 'Каталог: разделы и категории',
      template: 'T02, T03',
      routes: [
        { href: '/catalog/', label: 'Каталог, хаб' },
        ...categories.map((c) => ({ href: categoryPath(c), label: c.name })),
      ],
    },
    {
      title: 'Каталог: карточки продуктов',
      template: 'T04',
      routes: products.map((p) => ({ href: productPath(p), label: p.name })),
    },
    {
      title: 'SEO-посадки по маркам',
      template: 'T05',
      routes: activeGrades().map((g) => ({ href: `/beton/${gradeSlug(g)}/`, label: `Бетон ${g}` })),
    },
    {
      title: 'SEO-посадки по классам',
      template: 'T05',
      routes: activeClasses().map((c) => ({ href: `/beton/klass-${classSlug(c)}/`, label: `Класс ${c}` })),
    },
    {
      title: 'SEO-посадки по задаче',
      template: 'T05',
      routes: purposes.map((p) => ({ href: `/beton/dlya-${p.slug}/`, label: p.h1 })),
    },
    {
      title: 'Услуги',
      template: 'T02, T06',
      routes: [
        { href: '/uslugi/', label: 'Услуги, хаб' },
        ...services.map((s) => ({ href: `/uslugi/${s.slug}/`, label: s.name })),
      ],
    },
    {
      title: 'Доставка и география',
      template: 'T07a, T07',
      routes: [
        { href: '/dostavka/', label: 'Доставка, условия и зоны' },
        ...geoPoints.map((g) => ({ href: geoPath(g.slug), label: `Бетон в ${g.namePrep}` })),
      ],
    },
    {
      title: 'Прайс и калькулятор',
      template: 'T08, T09',
      routes: [
        { href: '/price/', label: 'Прайс' },
        { href: '/calculator/', label: 'Калькулятор' },
      ],
    },
    {
      title: 'Компания',
      template: 'T10, T11',
      routes: [
        ...pagesData.filter((p) => p.template === 'T10').map((p) => ({ href: `/${p.slug}/`, label: p.title })),
        { href: '/sertifikaty/', label: 'Сертификаты и документы' },
      ],
    },
    {
      title: 'Проекты',
      template: 'T12, T13',
      routes: [
        { href: '/proekty/', label: 'Проекты, список' },
        ...projects.map((p) => ({ href: `/proekty/${p.slug}/`, label: p.name })),
      ],
    },
    {
      title: 'Отзывы, акции, блог, вопросы',
      template: 'T14, T15, T16, T17',
      routes: [
        { href: '/otzyvy/', label: 'Отзывы' },
        { href: '/akcii/', label: 'Акции, список' },
        ...promos.map((p) => ({ href: `/akcii/${p.slug}/`, label: p.title })),
        { href: '/blog/', label: 'Блог, список' },
        ...posts.map((p) => ({ href: `/blog/${p.slug}/`, label: p.title })),
        { href: '/faq/', label: 'Вопросы и ответы' },
      ],
    },
    {
      title: 'Контакты и правовые страницы',
      template: 'T18, T19, T20',
      routes: [
        { href: '/kontakty/', label: 'Контакты' },
        ...pagesData.filter((p) => p.template === 'T19').map((p) => ({ href: `/${p.slug}/`, label: p.title })),
        { href: '/404.html', label: 'Страница не найдена' },
      ],
    },
    { title: 'Служебные', template: 'T00', routes: [{ href: '/_prototype/', label: 'Карта прототипа' }] },
  ];
}
