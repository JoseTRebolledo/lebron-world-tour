import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
  DEFAULT_TRIP_META,
  LEBRON_SEASONS,
  createId,
  formatSeasonLabel,
  getSeasonForDayIndex,
  normalizeImagePosition,
  normalizeTripMeta,
  parseCost,
  parsePriority,
} from './constants';

const resolveSeason = (seasonId, dayOrder) => {
  const byId = LEBRON_SEASONS.find((season) => season.id === seasonId);
  if (byId) return byId;
  return getSeasonForDayIndex(Number.isFinite(dayOrder) ? dayOrder : 0);
};

const HEADERS = [
  'dayId',
  'dayLabel',
  'dayOrder',
  'seasonId',
  'seasonLabel',
  'dayImageUrl',
  'imagePosition',
  'activityId',
  'title',
  'notes',
  'location',
  'cost',
  'priority',
  'imageUrl',
  'activityOrder',
  'foodPerDay',
  'lodgingPerDay',
  'roundTripTickets',
];

const META_HEADERS = ['foodPerDay', 'lodgingPerDay', 'roundTripTickets'];

const resolveImageUrl = (...candidates) => {
  const found = candidates.find((value) => String(value || '').trim().length > 0);
  return found ? String(found).trim() : '';
};

const rowGetter = (row) => {
  const entries = Object.entries(row || {});
  return (...keys) => {
    const found = keys.find((key) => row[key] !== undefined && row[key] !== null && row[key] !== '');
    if (found !== undefined) return row[found];
    const lowered = keys.map((key) => String(key).toLowerCase());
    const fuzzy = entries.find(([header, value]) => {
      if (value === undefined || value === null || value === '') return false;
      const h = String(header).trim().toLowerCase();
      return lowered.some((key) => h === key || h.includes(key));
    });
    return fuzzy ? fuzzy[1] : '';
  };
};

export const boardToRows = (board) => {
  const meta = normalizeTripMeta(board?.meta);
  const rows = [];
  const days = [...(board?.days || [])].sort((a, b) => a.order - b.order);
  days.forEach((day) => {
    const activities = [...(day.activities || [])].sort((a, b) => a.order - b.order);
    const base = {
      dayId: day.id,
      dayLabel: day.label,
      dayOrder: day.order,
      seasonId: day.seasonId || '',
      seasonLabel: day.seasonLabel || '',
      dayImageUrl: day.imageUrl || '',
      imagePosition: normalizeImagePosition(day.imagePosition),
      foodPerDay: meta.foodPerDay,
      lodgingPerDay: meta.lodgingPerDay,
      roundTripTickets: meta.roundTripTickets,
    };
    if (activities.length === 0) {
      rows.push({
        ...base,
        activityId: '',
        title: '',
        notes: '',
        location: '',
        cost: 0,
        priority: '',
        imageUrl: '',
        activityOrder: 0,
      });
      return;
    }
    activities.forEach((item) => {
      rows.push({
        ...base,
        activityId: item.id,
        title: item.title,
        notes: item.notes || '',
        location: item.location || '',
        cost: parseCost(item.cost),
        priority: parsePriority(item.priority),
        imageUrl: item.imageUrl || day.imageUrl || '',
        activityOrder: item.order,
      });
    });
  });
  return rows;
};

export const exportBoardToExcel = (board, fileName = 'lebron-world-tour-japan.xlsx') => {
  const meta = normalizeTripMeta(board?.meta);
  const rows = boardToRows(board);
  const itinerarySheet = XLSX.utils.json_to_sheet(rows, { header: HEADERS });
  const metadataSheet = XLSX.utils.json_to_sheet([meta], { header: META_HEADERS });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, itinerarySheet, 'Itinerary');
  XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata');
  const arrayBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, fileName);
};

const normalizeRow = (row) => {
  const get = rowGetter(row);
  const rawCost = get('cost', 'Cost', 'COST', 'precio', 'Precio', 'amount', 'monto');
  const rawPriority = get('priority', 'Priority', 'PRIORITY', 'prioridad', 'Prioridad');
  return {
    dayId: String(get('dayId', 'DayId', 'DAYID') || ''),
    dayLabel: String(get('dayLabel', 'DayLabel', 'DAYLABEL', 'day', 'Day') || '').trim(),
    dayOrder: Number(get('dayOrder', 'DayOrder', 'DAYORDER') || 0),
    seasonId: String(get('seasonId', 'SeasonId') || ''),
    seasonLabel: String(get('seasonLabel', 'SeasonLabel') || ''),
    dayImageUrl: String(get(
      'dayImageUrl',
      'DayImageUrl',
      'DAYIMAGEURL',
      'dayImage',
      'fotoDia',
      'imagenDia',
      'dayPhoto',
    ) || '').trim(),
    imagePosition: normalizeImagePosition(
      get('imagePosition', 'ImagePosition', 'dayImagePosition', 'fotoPosicion'),
    ),
    activityId: String(get('activityId', 'ActivityId', 'ACTIVITYID') || ''),
    title: String(get('title', 'Title', 'TITLE') || '').trim(),
    notes: String(get('notes', 'Notes', 'NOTES') || ''),
    location: String(get('location', 'Location', 'LOCATION') || ''),
    cost: parseCost(rawCost),
    priority: parsePriority(rawPriority),
    imageUrl: String(get(
      'imageUrl',
      'ImageUrl',
      'IMAGEURL',
      'activityImageUrl',
      'fotoActividad',
      'imagen',
    ) || '').trim(),
    activityOrder: Number(get('activityOrder', 'ActivityOrder', 'ACTIVITYORDER') || 0),
    foodPerDay: get('foodPerDay', 'FoodPerDay', 'comidaPorDia', 'comida'),
    lodgingPerDay: get('lodgingPerDay', 'LodgingPerDay', 'alojamientoPorDia', 'alojamiento', 'hotel'),
    roundTripTickets: get(
      'roundTripTickets',
      'RoundTripTickets',
      'pasajes',
      'pasajesIdaVuelta',
      'tickets',
    ),
  };
};

const metaFromRows = (rows, fallback = DEFAULT_TRIP_META) => {
  const withMeta = (rows || []).find((row) => (
    row.foodPerDay !== '' && row.foodPerDay !== undefined && row.foodPerDay !== null
  ) || (
    row.lodgingPerDay !== '' && row.lodgingPerDay !== undefined && row.lodgingPerDay !== null
  ) || (
    row.roundTripTickets !== '' && row.roundTripTickets !== undefined && row.roundTripTickets !== null
  ));
  if (!withMeta) return normalizeTripMeta(fallback);
  return normalizeTripMeta({
    foodPerDay: withMeta.foodPerDay,
    lodgingPerDay: withMeta.lodgingPerDay,
    roundTripTickets: withMeta.roundTripTickets,
  });
};

const metaFromSheet = (workbook) => {
  const sheetName = workbook.SheetNames.find((name) => (
    String(name).trim().toLowerCase() === 'metadata'
  ));
  if (!sheetName) return null;
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  if (!rawRows.length) return null;
  const get = rowGetter(rawRows[0]);
  const foodPerDay = get('foodPerDay', 'FoodPerDay', 'comidaPorDia', 'comidaPorDiaUsd');
  const lodgingPerDay = get(
    'lodgingPerDay',
    'LodgingPerDay',
    'alojamientoPorDia',
    'alojamientoPorDiaUsd',
  );
  const roundTripTickets = get(
    'roundTripTickets',
    'RoundTripTickets',
    'pasajesIdaVuelta',
    'pasajes',
  );
  if (foodPerDay === '' && lodgingPerDay === '' && roundTripTickets === '') {
    return null;
  }
  return normalizeTripMeta({ foodPerDay, lodgingPerDay, roundTripTickets });
};

export const rowsToBoard = (rawRows, metaOverride = null) => {
  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    throw new Error('El Excel está vacío o no tiene filas de datos.');
  }
  const rows = rawRows.map(normalizeRow);
  const hasLabel = rows.some((row) => row.dayLabel);
  if (!hasLabel) {
    throw new Error('Falta la columna dayLabel (o Day).');
  }

  const dayMap = new Map();
  rows.forEach((row, index) => {
    const label = row.dayLabel || `Día ${index + 1}`;
    const key = row.dayId || label;
    if (!dayMap.has(key)) {
      const order = Number.isFinite(row.dayOrder) ? row.dayOrder : dayMap.size;
      const season = resolveSeason(row.seasonId, order);
      const customDayImage = resolveImageUrl(row.dayImageUrl);
      dayMap.set(key, {
        id: row.dayId || createId('day'),
        label,
        order,
        seasonId: season.id,
        seasonLabel: row.seasonLabel || formatSeasonLabel(season),
        imageUrl: customDayImage || season.imageUrl,
        imagePosition: row.imagePosition,
        activities: [],
      });
    } else if (row.dayImageUrl) {
      const dayEntry = dayMap.get(key);
      const customDayImage = resolveImageUrl(row.dayImageUrl);
      if (customDayImage) {
        dayEntry.imageUrl = customDayImage;
      }
    }
    if (!row.title) return;
    const dayEntry = dayMap.get(key);
    const season = resolveSeason(dayEntry.seasonId, dayEntry.order);
    const activityImage = resolveImageUrl(
      row.imageUrl,
      dayEntry.imageUrl,
      season.imageUrl,
    );
    dayEntry.activities.push({
      id: row.activityId || createId('activity'),
      title: row.title,
      notes: row.notes,
      location: row.location,
      cost: row.cost,
      priority: row.priority,
      imageUrl: activityImage,
      order: Number.isFinite(row.activityOrder)
        ? row.activityOrder
        : dayEntry.activities.length,
    });
  });

  const days = Array.from(dayMap.values())
    .sort((a, b) => a.order - b.order)
    .map((day, dayIndex) => ({
      ...day,
      order: dayIndex,
      activities: [...day.activities]
        .sort((a, b) => a.order - b.order)
        .map((item, activityIndex) => ({ ...item, order: activityIndex })),
    }));

  if (days.length === 0) {
    throw new Error('No se pudo construir ningún día desde el Excel.');
  }

  const meta = metaOverride || metaFromRows(rows, DEFAULT_TRIP_META);
  return { meta, days };
};

export const importBoardFromExcel = async (file) => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames.find((name) => (
    String(name).trim().toLowerCase() !== 'metadata'
  )) || workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('El archivo no contiene hojas.');
  }
  const sheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const metaFromMetadataSheet = metaFromSheet(workbook);
  return rowsToBoard(rawRows, metaFromMetadataSheet);
};
