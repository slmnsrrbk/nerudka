import geoData from '../data/geo.json';
import type { Geo } from './types';

export const geoPoints = geoData as Geo[];

export const GEO_GROUPS: { id: Geo['group']; title: string }[] = [
  { id: 'moscow', title: 'Москва по округам' },
  { id: 'new-moscow', title: 'Новая Москва' },
  { id: 'mo', title: 'Московская область' },
];

export function getGeo(slug: string): Geo | undefined {
  return geoPoints.find((g) => g.slug === slug);
}

export function geoByGroup(group: Geo['group']): Geo[] {
  return geoPoints.filter((g) => g.group === group);
}

export function geoPath(slug: string): string {
  return `/dostavka/${slug}/`;
}

export function neighborsOf(geo: Geo): Geo[] {
  const direct = geo.neighbors.map(getGeo).filter((g): g is Geo => Boolean(g));
  if (direct.length >= 6) return direct.slice(0, 8);
  const extra = geoPoints
    .filter((g) => g.slug !== geo.slug && !direct.some((d) => d.slug === g.slug))
    .sort((a, b) => Math.abs(a.distanceKm - geo.distanceKm) - Math.abs(b.distanceKm - geo.distanceKm));
  return [...direct, ...extra].slice(0, 8);
}
