/* eslint-disable import/prefer-default-export */
/* Images from ESPN: https://www.espn.co.uk/nba/story/_/id/47447409/lebron-james-23-photos-define-nba-career */

import espn01 from '../assets/espn-01.jpg';
import espn02 from '../assets/espn-02.jpg';
import espn03 from '../assets/espn-03.jpg';
import espn04 from '../assets/espn-04.jpg';
import espn05 from '../assets/espn-05.jpg';
import espn06 from '../assets/espn-06.jpg';
import espn07 from '../assets/espn-07.jpg';
import espn08 from '../assets/espn-08.jpg';
import espn09 from '../assets/espn-09.jpg';
import espn10 from '../assets/espn-10.jpg';
import espn11 from '../assets/espn-11.jpg';
import espn12 from '../assets/espn-12.jpg';
import espn13 from '../assets/espn-13.jpg';
import espn14 from '../assets/espn-14.jpg';
import espn15 from '../assets/espn-15.jpg';
import espn16 from '../assets/espn-16.jpg';
import espn17 from '../assets/espn-17.jpg';
import espn18 from '../assets/espn-18.jpg';
import espn19 from '../assets/espn-19.jpg';
import espn20 from '../assets/espn-20.jpg';
import espn21 from '../assets/espn-21.jpg';
import espn22 from '../assets/espn-22.jpg';
import espn23 from '../assets/espn-23.jpg';

/** One ESPN gallery photo per NBA season (No. 1 → No. 23). */
const SEASON_PHOTOS = [
  espn01,
  espn02,
  espn03,
  espn04,
  espn05,
  espn06,
  espn07,
  espn08,
  espn09,
  espn10,
  espn11,
  espn12,
  espn13,
  espn14,
  espn15,
  espn16,
  espn17,
  espn18,
  espn19,
  espn20,
  espn21,
  espn22,
  espn23,
];

/**
 * Every NBA season LeBron has played (one photo slot per season / day).
 * Photo captions map to ESPN gallery order 1–23.
 */
const SEASON_DEFS = [
  { id: '2003-04', label: 'Cavs', years: '2003–04', team: 'Cleveland Cavaliers', moment: 'NBA debut dunk' },
  { id: '2004-05', label: 'Cavs', years: '2004–05', team: 'Cleveland Cavaliers', moment: 'Rising star years' },
  { id: '2005-06', label: 'Cavs', years: '2005–06', team: 'Cleveland Cavaliers', moment: 'First All-Star stretch' },
  { id: '2006-07', label: 'Cavs', years: '2006–07', team: 'Cleveland Cavaliers', moment: 'ECF game-winner vs Pistons' },
  { id: '2007-08', label: 'Cavs', years: '2007–08', team: 'Cleveland Cavaliers', moment: 'Finals with Bronny moment' },
  { id: '2008-09', label: 'Cavs', years: '2008–09', team: 'Cleveland Cavaliers', moment: 'Duncan handshake' },
  { id: '2009-10', label: 'Cavs', years: '2009–10', team: 'Cleveland Cavaliers', moment: 'Last Cavs 1.0 season' },
  { id: '2010-11', label: 'Heat', years: '2010–11', team: 'Miami Heat', moment: 'Heatles welcome party' },
  { id: '2011-12', label: 'Heat', years: '2011–12', team: 'Miami Heat', moment: 'Return to Cleveland / title run' },
  { id: '2012-13', label: 'Heat', years: '2012–13', team: 'Miami Heat', moment: 'Wade → LeBron dunk' },
  { id: '2013-14', label: 'Heat', years: '2013–14', team: 'Miami Heat', moment: '45-pt Game 6 vs Celtics / titles' },
  { id: '2014-15', label: 'Cavs', years: '2014–15', team: 'Cleveland Cavaliers', moment: 'Alley-oop / return era' },
  { id: '2015-16', label: 'Cavs', years: '2015–16', team: 'Cleveland Cavaliers', moment: 'The Block' },
  { id: '2016-17', label: 'Cavs', years: '2016–17', team: 'Cleveland Cavaliers', moment: 'Finals MVP celebration' },
  { id: '2017-18', label: 'Cavs', years: '2017–18', team: 'Cleveland Cavaliers', moment: 'Parade / last Cleveland run' },
  { id: '2018-19', label: 'Lakers', years: '2018–19', team: 'Los Angeles Lakers', moment: 'Game 7 ECF / Finals reaction' },
  { id: '2019-20', label: 'Lakers', years: '2019–20', team: 'Los Angeles Lakers', moment: 'Kobe tribute' },
  { id: '2020-21', label: 'Lakers', years: '2020–21', team: 'Los Angeles Lakers', moment: 'Mamba dunk / bubble title' },
  { id: '2021-22', label: 'Lakers', years: '2021–22', team: 'Los Angeles Lakers', moment: 'Championship cigar' },
  { id: '2022-23', label: 'Lakers', years: '2022–23', team: 'Los Angeles Lakers', moment: 'Scoring record night' },
  { id: '2023-24', label: 'Lakers', years: '2023–24', team: 'Los Angeles Lakers', moment: 'Olympic gold / Avengers' },
  { id: '2024-25', label: 'Lakers', years: '2024–25', team: 'Los Angeles Lakers', moment: 'Father-son debut' },
  { id: '2025-26', label: 'Lakers', years: '2025–26', team: 'Los Angeles Lakers', moment: 'Season 23' },
];

export const LEBRON_SEASONS = SEASON_DEFS.map((season, index) => ({
  ...season,
  imageUrl: SEASON_PHOTOS[index],
  espnPhotoNo: index + 1,
}));

/** @deprecated use LEBRON_SEASONS */
export const LEBRON_IMAGES = LEBRON_SEASONS.map((season) => season.imageUrl);

export const BOARD_STORAGE_KEY = 'lebron-world-tour-board-v1';

/** Trip-level cost metadata (USD). */
export const DEFAULT_TRIP_META = {
  foodPerDay: 0,
  lodgingPerDay: 0,
  roundTripTickets: 0,
};

export const createId = (prefix = 'id') => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const getSeasonForDayIndex = (index) => (
  LEBRON_SEASONS[((index % LEBRON_SEASONS.length) + LEBRON_SEASONS.length) % LEBRON_SEASONS.length]
);

export const formatSeasonLabel = (season) => `${season.years} · ${season.label}`;

/** CSS object-position options for day/activity photos. */
export const IMAGE_POSITIONS = [
  { id: 'top', label: 'Arriba', value: 'top' },
  { id: 'center', label: 'Centro', value: 'center' },
  { id: 'bottom', label: 'Abajo', value: 'bottom' },
];

export const DEFAULT_IMAGE_POSITION = 'top';

export const normalizeImagePosition = (value) => {
  const match = IMAGE_POSITIONS.find((item) => item.id === value || item.value === value);
  return match ? match.value : DEFAULT_IMAGE_POSITION;
};

/** Activity priority scale 1 (low) → 5 (must-do). Missing/invalid → 3. */
export const DEFAULT_PRIORITY = 3;
export const PRIORITY_OPTIONS = [1, 2, 3, 4, 5];

export const parsePriority = (value) => {
  if (value === null || value === undefined || value === '') return DEFAULT_PRIORITY;
  const num = Number(value);
  if (!Number.isFinite(num)) return DEFAULT_PRIORITY;
  const rounded = Math.round(num);
  if (rounded < 1 || rounded > 5) return DEFAULT_PRIORITY;
  return rounded;
};

export const nextImagePosition = (current) => {
  const index = IMAGE_POSITIONS.findIndex((item) => item.value === normalizeImagePosition(current));
  const next = IMAGE_POSITIONS[(index + 1) % IMAGE_POSITIONS.length];
  return next.value;
};

/** Parse cost from form/Excel; empty → 0.
 * Accepts numbers, "45", "45.5", "45,5", "1.500,50", "1,500.50", "$45".
 * Heuristic: if the last separator is "," → EU/CL decimal; if "." → US decimal.
 * A single "." or "," followed by exactly 3 digits is treated as thousands.
 */
export const parseCost = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, value);
  }
  if (value === null || value === undefined || value === '') return 0;

  let text = String(value).trim();
  if (!text) return 0;
  text = text.replace(/[$€£¥]|USD|CLP|EUR/gi, '').replace(/\s/g, '');

  const hasDot = text.includes('.');
  const hasComma = text.includes(',');

  if (hasDot && hasComma) {
    if (text.lastIndexOf(',') > text.lastIndexOf('.')) {
      // 1.500,50 → 1500.50
      text = text.replace(/\./g, '').replace(',', '.');
    } else {
      // 1,500.50 → 1500.50
      text = text.replace(/,/g, '');
    }
  } else if (hasComma) {
    const parts = text.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      // 45,5 → 45.5
      text = `${parts[0]}.${parts[1]}`;
    } else {
      // 1,500 or 1,500,000 → thousands
      text = text.replace(/,/g, '');
    }
  } else if (hasDot) {
    const parts = text.split('.');
    if (parts.length === 2 && parts[1].length === 3 && parts[0].length >= 1) {
      // 1.500 → 1500 (CL/EU thousands)
      text = text.replace(/\./g, '');
    }
    // else 45.5 stays as decimal
  }

  text = text.replace(/[^0-9.-]/g, '');
  const amount = Number(text);
  return Number.isFinite(amount) ? Math.max(0, amount) : 0;
};

/** Display cost in USD. */
export const formatCost = (value) => {
  const amount = parseCost(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
};

export const sumActivitiesCost = (activities = []) => (
  activities.reduce((total, activity) => total + parseCost(activity?.cost), 0)
);

export const normalizeTripMeta = (meta = {}) => ({
  foodPerDay: parseCost(meta?.foodPerDay ?? DEFAULT_TRIP_META.foodPerDay),
  lodgingPerDay: parseCost(meta?.lodgingPerDay ?? DEFAULT_TRIP_META.lodgingPerDay),
  roundTripTickets: parseCost(meta?.roundTripTickets ?? DEFAULT_TRIP_META.roundTripTickets),
});

export const computeTripFixedCosts = (meta, dayCount) => {
  const normalized = normalizeTripMeta(meta);
  const days = Math.max(0, Number(dayCount) || 0);
  const foodTotal = normalized.foodPerDay * days;
  const lodgingTotal = normalized.lodgingPerDay * days;
  const ticketsTotal = normalized.roundTripTickets;
  return {
    ...normalized,
    foodTotal,
    lodgingTotal,
    ticketsTotal,
    fixedTotal: foodTotal + lodgingTotal + ticketsTotal,
  };
};
