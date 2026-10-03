import data from '../data/site.json';

// Контакты из site.json; почта — [заглушка], пока заказчик не дал настоящую.
export const site = {
  name: data.name,
  phone: data.phone,
  phoneHref: data.phoneHref,
  email: data.email,
  tg: data.messengers.telegram,
  max: data.messengers.max,
  legal: `${data.legalName} · ИНН ${data.requisites.inn} · ${data.address}`,
  hours: data.workHours,
};
