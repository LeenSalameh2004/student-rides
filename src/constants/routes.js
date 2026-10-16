// Operational routes for the Amman launch.
// Coordinates are approximate starting points — VERIFY each pin on Google Maps
// before launch and paste the exact lat/lng here.

export const UNIVERSITY = {
  id: 'uj',
  name: { ar: 'الجامعة الأردنية', en: 'University of Jordan' },
  coords: { latitude: 32.0136, longitude: 35.8722 }, // VERIFY: main gate
};

export const AREAS = [
  {
    id: 'amir-rashid',
    name: { ar: 'ضاحية الأمير راشد', en: 'Dahiyat Al-Amir Rashid' },
    landmark: null,
    coords: { latitude: 32.005, longitude: 35.864 }, // VERIFY
  },
  {
    id: 'yadoudeh',
    name: { ar: 'اليادودة', en: 'Al-Yadoudeh' },
    landmark: { ar: 'قرب سوبرماركت أحمد الجيلاني', en: 'Near Ahmed Al-Jilani Supermarket' },
    coords: { latitude: 31.874, longitude: 35.933 }, // VERIFY: supermarket pickup point
  },
];

export const DIRECTIONS = ['toUni', 'fromUni'];

export const AMMAN_REGION = {
  latitude: 31.96,
  longitude: 35.9,
  latitudeDelta: 0.25,
  longitudeDelta: 0.25,
};

export function areaById(id) {
  return AREAS.find((a) => a.id === id) || null;
}

// "Dahiyat Al-Amir Rashid → University of Jordan" in the current language.
export function routeLabel(areaId, direction, lang) {
  const area = areaById(areaId);
  const l = lang === 'en' ? 'en' : 'ar';
  const areaName = area ? area.name[l] : areaId;
  const uni = UNIVERSITY.name[l];
  const arrow = l === 'ar' ? '←' : '→'; // Arabic reads right-to-left
  return direction === 'fromUni' ? `${uni} ${arrow} ${areaName}` : `${areaName} ${arrow} ${uni}`;
}
