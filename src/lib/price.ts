// Единая точка расчёта цены. Используется калькулятором на главной,
// в карточке продукта, на /calculator/, в прайсе и на гео-страницах.
import site from '../data/site.json';
import type { Product, Zone } from './types';

export const zones = site.deliveryZones as Zone[];

export function getZone(zoneId: string): Zone {
  return zones.find((z) => z.id === zoneId) ?? zones[0]!;
}

/** Цена доставки за м³ для выбранной зоны. */
export function deliveryPerM3(zoneId: string): number {
  return getZone(zoneId).pricePerM3;
}

/** Цена м³ с доставкой в зону. */
export function priceWithDelivery(price: number, zoneId: string): number {
  return price + deliveryPerM3(zoneId);
}

/** Скидка в процентах по объёму (из site.json). */
export function discountPercent(volume: number): number {
  let percent = 0;
  for (const step of site.volumeDiscounts) {
    if (volume >= step.from) percent = step.percent;
  }
  return percent;
}

export type CalcInput = {
  price: number;
  volume: number;
  zoneId: string;
  pump?: boolean;
  pumpPrice?: number;
};

export type CalcResult = {
  volume: number;
  mix: number;
  delivery: number;
  pump: number;
  discountPercent: number;
  discount: number;
  total: number;
  perM3: number;
};

export function calc({ price, volume, zoneId, pump = false, pumpPrice = 18000 }: CalcInput): CalcResult {
  const v = Math.max(site.minVolume, Number.isFinite(volume) ? volume : site.minVolume);
  const mix = price * v;
  const delivery = deliveryPerM3(zoneId) * v;
  const pumpSum = pump ? pumpPrice : 0;
  const percent = discountPercent(v);
  const discount = Math.round(((mix + delivery) * percent) / 100);
  const total = mix + delivery + pumpSum - discount;
  return {
    volume: v,
    mix,
    delivery,
    pump: pumpSum,
    discountPercent: percent,
    discount,
    total,
    perM3: Math.round(total / v),
  };
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value));
}

/** Цена за м³ с доставкой в гео-пункт (для T07). */
export function geoPricePerM3(product: Product, zoneId: string): number {
  return priceWithDelivery(product.price, zoneId);
}
