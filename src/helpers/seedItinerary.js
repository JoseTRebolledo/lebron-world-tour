import {
  DEFAULT_IMAGE_POSITION,
  DEFAULT_PRIORITY,
  DEFAULT_TRIP_META,
  LEBRON_SEASONS,
  createId,
  formatSeasonLabel,
  normalizeTripMeta,
} from './constants';

const DEMO_TRIP_META = normalizeTripMeta({
  ...DEFAULT_TRIP_META,
  foodPerDay: 45,
  lodgingPerDay: 95,
  roundTripTickets: 1200,
});

/** Japan stops cycled across every career season / day. */
const JAPAN_STOPS = [
  { city: 'Tokio', focus: 'Shibuya', tip: 'Crossing + ramen de llegada.' },
  { city: 'Tokio', focus: 'Asakusa', tip: 'Senso-ji y Nakamise-dori.' },
  { city: 'Tokio', focus: 'Akihabara', tip: 'Arcades y electrónicos.' },
  { city: 'Tokio', focus: 'Harajuku', tip: 'Meiji y Takeshita Street.' },
  { city: 'Tokio', focus: 'TeamLab', tip: 'Tickets online con anticipación.' },
  { city: 'Yokohama', focus: 'Minato Mirai', tip: 'Bahía y cup noodles museum.' },
  { city: 'Hakone', focus: 'Onsen', tip: 'Ryokan y vistas al Fuji si hay suerte.' },
  { city: 'Tokio', focus: 'Shinkansen', tip: 'Salida rumbo a Kansai.' },
  { city: 'Kioto', focus: 'Gion', tip: 'Calles de madera al atardecer.' },
  { city: 'Kioto', focus: 'Fushimi Inari', tip: 'Torii temprano, menos gente.' },
  { city: 'Kioto', focus: 'Arashiyama', tip: 'Bosque de bambú.' },
  { city: 'Kioto', focus: 'Kiyomizu', tip: 'Templo y vistas de la ciudad.' },
  { city: 'Nara', focus: 'Parque', tip: 'Ciervos y Todai-ji.' },
  { city: 'Osaka', focus: 'Dotonbori', tip: 'Takoyaki y neón.' },
  { city: 'Osaka', focus: 'Castillo', tip: 'Parque del castillo.' },
  { city: 'Osaka', focus: 'Kuromon', tip: 'Mercado de comida.' },
  { city: 'Kobe', focus: 'Harbor', tip: 'Puerto y beef si el budget da.' },
  { city: 'Hiroshima', focus: 'Peace Park', tip: 'Memorial y reflexión.' },
  { city: 'Miyajima', focus: 'Itsukushima', tip: 'Torii en el agua.' },
  { city: 'Tokio', focus: 'Odaiba', tip: 'Vuelta a Kanto / teamLab Borderless.' },
  { city: 'Tokio', focus: 'Shinjuku', tip: 'Skyline y izakayas.' },
  { city: 'Tokio', focus: 'Tsukiji', tip: 'Mercado exterior y sushi.' },
  { city: 'Narita / Haneda', focus: 'Cierre', tip: 'Souvenirs last-minute y vuelo.' },
];

const activity = (
  title,
  notes,
  location,
  imageUrl,
  order,
  cost = 0,
  priority = DEFAULT_PRIORITY,
) => ({
  id: createId('activity'),
  title,
  notes,
  location,
  imageUrl,
  order,
  cost,
  priority,
});

const buildDayShell = (season, index, { withDemoActivities = true } = {}) => {
  const stop = JAPAN_STOPS[index % JAPAN_STOPS.length];
  const dayNumber = index + 1;
  const day = {
    id: createId('day'),
    label: `Día ${dayNumber} — ${stop.city} · ${stop.focus}`,
    order: index,
    seasonId: season.id,
    seasonLabel: formatSeasonLabel(season),
    imageUrl: season.imageUrl,
    imagePosition: DEFAULT_IMAGE_POSITION,
    activities: [],
  };
  if (!withDemoActivities) return day;
  const baseCost = 25 + ((index * 7) % 40);
  day.activities = [
    activity(
      `${stop.focus}: plan del día`,
      `${stop.tip} Temporada ${season.years} (${season.team}).`,
      `${stop.city}, Japón`,
      season.imageUrl,
      0,
      baseCost,
      4,
    ),
    activity(
      `ESPN No. ${season.espnPhotoNo}: ${season.moment}`,
      `Foto de la galería “23 photos” · ${season.years} · ${season.label}.`,
      stop.city,
      season.imageUrl,
      1,
      Math.round(baseCost * 0.4),
      3,
    ),
  ];

  return day;
};

/** Full demo itinerary (Japan stops + sample activities). */
export function buildSeedItinerary() {
  return {
    meta: DEMO_TRIP_META,
    days: LEBRON_SEASONS.map((season, index) => (
      buildDayShell(season, index, { withDemoActivities: true })
    )),
  };
}

/** Same season days / Japan labels as the demo seed, but no activities — ready to fill. */
export function buildEmptyItinerary(meta = DEFAULT_TRIP_META) {
  return {
    meta: normalizeTripMeta(meta),
    days: LEBRON_SEASONS.map((season, index) => (
      buildDayShell(season, index, { withDemoActivities: false })
    )),
  };
}
