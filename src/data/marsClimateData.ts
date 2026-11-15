import {
  MEASURED_MARS_STATIONS,
  MeasuredStationRecord,
  NAMED_MARS_REGIONS
} from './marsWeatherStations';
import { findMatchingMarsLocation } from './marsLocations';
import { marsDistanceKm, normalizeLonE } from './arcadiaData';

export const CLIMATE_COVERAGE_MAX_LAT = 85.0;
const CLIMATE_CACHE_NAME = 'ares-mars-climate-v1';

export type TempScenarioId = 'ls90_day' | 'ls270_day' | 'ls90_night';
export type StormScenarioId = 'my34_storm' | 'perihelion_storm' | 'clear_baseline';

export interface TempScenarioGrid {
  id: TempScenarioId;
  label: string;
  period: string;
  ls: number;
  localtime: number;
  dustScenario: string;
  minC: number;
  maxC: number;
  gridC: number[][];
}

export interface StormScenarioGrid {
  id: StormScenarioId;
  label: string;
  period: string;
  ls: number;
  localtime: number;
  dustScenario: string;
  minWindMs: number;
  maxWindMs: number;
  minTau: number;
  maxTau: number;
  windMs: number[][];
  uMs: number[][];
  vMs: number[][];
  tau: number[][];
}

export interface McdTemperatureFile {
  lats: number[];
  lonsE: number[];
  scenarios: Record<TempScenarioId, TempScenarioGrid>;
}

export interface McdStormFile {
  lats: number[];
  lonsE: number[];
  scenarios: Record<StormScenarioId, StormScenarioGrid>;
}

export interface ScenarioMeta<T extends string> {
  id: T;
  label: string;
  period: string;
}

export const TEMP_SCENARIO_LIST: ScenarioMeta<TempScenarioId>[] = [
  {
    id: 'ls90_day',
    label: 'Northern Summer Afternoon',
    period: 'Ls 90° (Northern Summer Solstice) · 14:00 Local Solar Time'
  },
  {
    id: 'ls270_day',
    label: 'Southern Summer Afternoon (Perihelion)',
    period: 'Ls 270° (Southern Summer Solstice) · 14:00 Local Solar Time'
  },
  {
    id: 'ls90_night',
    label: 'Northern Summer Pre-Dawn',
    period: 'Ls 90° (Northern Summer Solstice) · 03:00 Local Solar Time'
  }
];

export const STORM_SCENARIO_LIST: ScenarioMeta<StormScenarioId>[] = [
  {
    id: 'my34_storm',
    label: 'MY 34 Global Dust Storm (2018)',
    period: 'Martian Year 34 (June–July 2018) · Ls 205° · 15:00 Local Solar Time'
  },
  {
    id: 'perihelion_storm',
    label: 'Southern Summer Dust-Storm Season',
    period: 'Dust Storm Climatology · Ls 255° · 15:00 Local Solar Time'
  },
  {
    id: 'clear_baseline',
    label: 'Clear-Sky Baseline (Comparison)',
    period: 'Climatology Ave Solar · Ls 90° · 15:00 Local Solar Time'
  }
];

export interface DatasetLoadResult<T> {
  data: T;
  sourceMode: 'network' | 'cache' | 'backup';
  warning?: string;
}

let memoryTempDataset: McdTemperatureFile | null = null;
let memoryStormDataset: McdStormFile | null = null;
let pendingTempPromise: Promise<DatasetLoadResult<McdTemperatureFile>> | null = null;
let pendingStormPromise: Promise<DatasetLoadResult<McdStormFile>> | null = null;

function isValidTempDataset(raw: unknown): raw is McdTemperatureFile {
  if (!raw || typeof raw !== 'object') return false;
  const obj = raw as Partial<McdTemperatureFile>;
  return (
    Array.isArray(obj.lats) &&
    obj.lats.length >= 10 &&
    Array.isArray(obj.lonsE) &&
    obj.lonsE.length >= 10 &&
    Boolean(obj.scenarios?.ls90_day?.gridC?.length) &&
    Boolean(obj.scenarios?.ls270_day?.gridC?.length) &&
    Boolean(obj.scenarios?.ls90_night?.gridC?.length)
  );
}

function isValidStormDataset(raw: unknown): raw is McdStormFile {
  if (!raw || typeof raw !== 'object') return false;
  const obj = raw as Partial<McdStormFile>;
  return (
    Array.isArray(obj.lats) &&
    obj.lats.length >= 10 &&
    Array.isArray(obj.lonsE) &&
    obj.lonsE.length >= 10 &&
    Boolean(obj.scenarios?.my34_storm?.windMs?.length) &&
    Boolean(obj.scenarios?.perihelion_storm?.windMs?.length) &&
    Boolean(obj.scenarios?.clear_baseline?.windMs?.length)
  );
}

async function fetchJsonWithCache<T>(
  url: string,
  validator: (raw: unknown) => raw is T
): Promise<{ data: T; fromCache: boolean }> {
  // 1. Check Cache API first if supported in browser context
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await window.caches.open(CLIMATE_CACHE_NAME);
      const cachedRes = await cache.match(url);
      if (cachedRes && cachedRes.ok) {
        const json = (await cachedRes.json()) as unknown;
        if (validator(json)) {
          return { data: json, fromCache: true };
        }
      }
      const netRes = await fetch(url, { cache: 'default' });
      if (!netRes.ok) {
        throw new Error(`HTTP ${netRes.status} while retrieving ${url}`);
      }
      const cloned = netRes.clone();
      const json = (await netRes.json()) as unknown;
      if (!validator(json)) {
        throw new Error(`Invalid dataset schema returned from ${url}`);
      }
      await cache.put(url, cloned).catch(() => undefined);
      return { data: json, fromCache: false };
    } catch (err) {
      // Fall through to plain fetch if Cache API throws (e.g. restricted iframe storage)
      if (err instanceof Error && /HTTP|Invalid dataset/.test(err.message)) {
        throw err;
      }
    }
  }

  const res = await fetch(url, { cache: 'default' });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} while retrieving ${url}`);
  }
  const json = (await res.json()) as unknown;
  if (!validator(json)) {
    throw new Error(`Invalid dataset schema returned from ${url}`);
  }
  return { data: json, fromCache: false };
}

export async function loadTemperatureDataset(
  forceReload = false
): Promise<DatasetLoadResult<McdTemperatureFile>> {
  if (!forceReload && memoryTempDataset) {
    return { data: memoryTempDataset, sourceMode: 'cache' };
  }
  if (!forceReload && pendingTempPromise) {
    return pendingTempPromise;
  }

  pendingTempPromise = (async () => {
    try {
      const { data, fromCache } = await fetchJsonWithCache(
        '/data/mcdTemperatureData.json',
        isValidTempDataset
      );
      memoryTempDataset = data;
      return {
        data,
        sourceMode: fromCache ? 'cache' : 'network'
      };
    } catch (primaryErr) {
      const reason = primaryErr instanceof Error ? primaryErr.message : 'Network error';
      // Backup verified bundled dataset
      const mod = await import('./mcdTemperatureData.json');
      const fallback = (mod.default ?? mod) as unknown;
      if (!isValidTempDataset(fallback)) {
        throw new Error(`Primary and backup temperature datasets unavailable (${reason}).`);
      }
      memoryTempDataset = fallback;
      return {
        data: fallback,
        sourceMode: 'backup',
        warning: `Live data endpoint failed (${reason}). Switched to verified bundled MCD v6.2 archive.`
      };
    } finally {
      pendingTempPromise = null;
    }
  })();

  return pendingTempPromise;
}

export async function loadStormDataset(
  forceReload = false
): Promise<DatasetLoadResult<McdStormFile>> {
  if (!forceReload && memoryStormDataset) {
    return { data: memoryStormDataset, sourceMode: 'cache' };
  }
  if (!forceReload && pendingStormPromise) {
    return pendingStormPromise;
  }

  pendingStormPromise = (async () => {
    try {
      const { data, fromCache } = await fetchJsonWithCache(
        '/data/mcdStormData.json',
        isValidStormDataset
      );
      memoryStormDataset = data;
      return {
        data,
        sourceMode: fromCache ? 'cache' : 'network'
      };
    } catch (primaryErr) {
      const reason = primaryErr instanceof Error ? primaryErr.message : 'Network error';
      const mod = await import('./mcdStormData.json');
      const fallback = (mod.default ?? mod) as unknown;
      if (!isValidStormDataset(fallback)) {
        throw new Error(`Primary and backup storm datasets unavailable (${reason}).`);
      }
      memoryStormDataset = fallback;
      return {
        data: fallback,
        sourceMode: 'backup',
        warning: `Live data endpoint failed (${reason}). Switched to verified bundled MCD v6.2 archive.`
      };
    } finally {
      pendingStormPromise = null;
    }
  })();

  return pendingStormPromise;
}

// Fast bracket lookup in sorted ascending grid axis
function findBracket(arr: number[], val: number): [number, number, number] {
  if (val <= arr[0]) return [0, 0, 0];
  const last = arr.length - 1;
  if (val >= arr[last]) return [last, last, 0];
  let lo = 0;
  let hi = last;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] <= val) lo = mid;
    else hi = mid;
  }
  const span = arr[hi] - arr[lo];
  const t = span > 0 ? (val - arr[lo]) / span : 0;
  return [lo, hi, t];
}

function findLonBracket(lonsE: number[], lonDeg: number): [number, number, number] {
  const lon = normalizeLonE(lonDeg);
  const n = lonsE.length;
  if (lon < lonsE[0] || lon >= lonsE[n - 1]) {
    const prevLon = lonsE[n - 1] - 360;
    const nextLon = lonsE[0];
    const adjLon = lon >= lonsE[n - 1] ? lon - 360 : lon;
    const span = nextLon - prevLon;
    const t = span > 0 ? Math.max(0, Math.min(1, (adjLon - prevLon) / span)) : 0;
    return [n - 1, 0, t];
  }
  return findBracket(lonsE, lon);
}

function bilinearSample(
  grid: number[][],
  lats: number[],
  lonsE: number[],
  lat: number,
  lonDeg: number
): number {
  const [r0, r1, ty] = findBracket(lats, lat);
  const [c0, c1, tx] = findLonBracket(lonsE, lonDeg);

  const v00 = grid[r0][c0];
  const v01 = grid[r0][c1];
  const v10 = grid[r1][c0];
  const v11 = grid[r1][c1];

  const top = v00 * (1 - tx) + v01 * tx;
  const bot = v10 * (1 - tx) + v11 * tx;
  return top * (1 - ty) + bot * ty;
}

export function findLocationContext(
  lat: number,
  lonDeg: number
): {
  locationName: string | null;
  regionNote: string | null;
  nearestStation: { station: MeasuredStationRecord; distanceKm: number } | null;
} {
  const lonE = normalizeLonE(lonDeg);

  // 1. Check shared 3D/2D Mars Locations database first
  const matchedShared = findMatchingMarsLocation(lat, lonE, 5.5);

  let closestStation: { station: MeasuredStationRecord; distanceKm: number } | null = null;
  for (const st of MEASURED_MARS_STATIONS) {
    const d = marsDistanceKm(lat, lonE, st.lat, st.lonE);
    if (!closestStation || d < closestStation.distanceKm) {
      closestStation = { station: st, distanceKm: d };
    }
  }

  if (matchedShared) {
    const linkedStation = matchedShared.stationId
      ? MEASURED_MARS_STATIONS.find((s) => s.id === matchedShared.stationId)
      : undefined;
    return {
      locationName: matchedShared.name,
      regionNote: matchedShared.summary,
      nearestStation: linkedStation
        ? {
            station: linkedStation,
            distanceKm: marsDistanceKm(lat, lonE, linkedStation.lat, linkedStation.lonE)
          }
        : closestStation && closestStation.distanceKm <= 1200
        ? closestStation
        : null
    };
  }

  if (closestStation && closestStation.distanceKm <= 280) {
    return {
      locationName: closestStation.station.name,
      regionNote: `${closestStation.station.mission} surface landing region (${closestStation.station.elevationNote}).`,
      nearestStation: closestStation
    };
  }

  // 2. Check broader named planetary regions
  let matchedRegion: (typeof NAMED_MARS_REGIONS)[number] | null = null;
  let bestScore = Infinity;
  for (const reg of NAMED_MARS_REGIONS) {
    let dLon = Math.abs(lonE - reg.lonE);
    if (dLon > 180) dLon = 360 - dLon;
    const dLat = Math.abs(lat - reg.lat);
    const angularDist = Math.sqrt(dLat * dLat + dLon * dLon);
    if (angularDist <= reg.radiusDeg && angularDist < bestScore) {
      bestScore = angularDist;
      matchedRegion = reg;
    }
  }

  if (matchedRegion) {
    return {
      locationName: matchedRegion.name,
      regionNote: matchedRegion.contextNote,
      nearestStation:
        closestStation && closestStation.distanceKm <= 1200 ? closestStation : null
    };
  }

  return {
    locationName: null,
    regionNote: null,
    nearestStation:
      closestStation && closestStation.distanceKm <= 1200 ? closestStation : null
  };
}

export interface TemperatureBand {
  label: 'Coldest' | 'Cold' | 'Moderate' | 'Warm' | 'Warmest';
  rangeText: string;
  hex: string;
  rgb: [number, number, number];
}

export const TEMPERATURE_LEGEND_BANDS: TemperatureBand[] = [
  { label: 'Coldest', rangeText: '≤ −105°C', hex: '#1E3A8A', rgb: [30, 58, 138] },
  { label: 'Cold', rangeText: '−105 to −65°C', hex: '#38BDF8', rgb: [56, 189, 248] },
  { label: 'Moderate', rangeText: '−65 to −25°C', hex: '#FACC15', rgb: [250, 204, 21] },
  { label: 'Warm', rangeText: '−25 to 0°C', hex: '#F97316', rgb: [249, 115, 22] },
  { label: 'Warmest', rangeText: '> 0°C', hex: '#DC2626', rgb: [220, 38, 38] }
];

const TEMP_COLOR_STOPS: { val: number; rgb: [number, number, number] }[] = [
  { val: -125, rgb: [23, 37, 110] }, // Dark blue (coldest)
  { val: -100, rgb: [30, 64, 175] }, // Deep blue transition
  { val: -72, rgb: [56, 189, 248] }, // Light blue (cold)
  { val: -38, rgb: [250, 204, 21] }, // Yellow (moderate)
  { val: -10, rgb: [249, 115, 22] }, // Orange (warm)
  { val: 18, rgb: [220, 38, 38] } // Red (warmest)
];

function lerpColor(
  stops: { val: number; rgb: [number, number, number] }[],
  v: number
): [number, number, number] {
  if (v <= stops[0].val) return stops[0].rgb;
  const last = stops.length - 1;
  if (v >= stops[last].val) return stops[last].rgb;
  for (let i = 0; i < last; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (v >= a.val && v <= b.val) {
      const t = (v - a.val) / (b.val - a.val);
      return [
        Math.round(a.rgb[0] + (b.rgb[0] - a.rgb[0]) * t),
        Math.round(a.rgb[1] + (b.rgb[1] - a.rgb[1]) * t),
        Math.round(a.rgb[2] + (b.rgb[2] - a.rgb[2]) * t)
      ];
    }
  }
  return stops[last].rgb;
}

export function getTemperatureBand(tempC: number): TemperatureBand {
  if (tempC <= -105) return TEMPERATURE_LEGEND_BANDS[0];
  if (tempC <= -65) return TEMPERATURE_LEGEND_BANDS[1];
  if (tempC <= -25) return TEMPERATURE_LEGEND_BANDS[2];
  if (tempC <= 0) return TEMPERATURE_LEGEND_BANDS[3];
  return TEMPERATURE_LEGEND_BANDS[4];
}

export interface TemperatureQueryResult {
  available: boolean;
  lat: number;
  lonE: number;
  tempC: number | null;
  band: TemperatureBand | null;
  locationName: string | null;
  regionNote: string | null;
  period: string;
  source: string;
  dataType: 'Modelled (Mars Climate Database v6.2)' | 'Unavailable';
  nearestStation: { station: MeasuredStationRecord; distanceKm: number } | null;
  unavailableReason?: string;
}

export function queryTemperatureAtPoint(
  lat: number,
  lonDeg: number,
  scenarioId: TempScenarioId,
  dataset: McdTemperatureFile | null
): TemperatureQueryResult {
  const lonE = normalizeLonE(lonDeg);
  const meta = TEMP_SCENARIO_LIST.find((s) => s.id === scenarioId) ?? TEMP_SCENARIO_LIST[0];
  const ctx = findLocationContext(lat, lonE);

  if (!dataset) {
    return {
      available: false,
      lat,
      lonE,
      tempC: null,
      band: null,
      locationName: ctx.locationName,
      regionNote: ctx.regionNote,
      period: meta.period,
      source: 'Mars Climate Database v6.2 (LMD / ESA / NASA TES & THEMIS basis)',
      dataType: 'Unavailable',
      nearestStation: ctx.nearestStation,
      unavailableReason: 'Temperature dataset is still loading or temporarily unavailable.'
    };
  }

  const scenario = dataset.scenarios[scenarioId];

  if (Math.abs(lat) > CLIMATE_COVERAGE_MAX_LAT || !Number.isFinite(lat)) {
    return {
      available: false,
      lat,
      lonE,
      tempC: null,
      band: null,
      locationName: ctx.locationName,
      regionNote: ctx.regionNote,
      period: scenario.period,
      source: 'Mars Climate Database v6.2 (LMD / ESA / NASA TES & THEMIS basis)',
      dataType: 'Unavailable',
      nearestStation: ctx.nearestStation,
      unavailableReason: 'Temperature data unavailable for this location.'
    };
  }

  const tempC = Number(
    bilinearSample(scenario.gridC, dataset.lats, dataset.lonsE, lat, lonE).toFixed(1)
  );

  return {
    available: true,
    lat,
    lonE,
    tempC,
    band: getTemperatureBand(tempC),
    locationName: ctx.locationName,
    regionNote: ctx.regionNote,
    period: scenario.period,
    source: `${scenario.dustScenario} — LMD / ESA Mars Climate Database v6.2`,
    dataType: 'Modelled (Mars Climate Database v6.2)',
    nearestStation: ctx.nearestStation
  };
}

export function sampleTemperaturePixelRgb(
  dataset: McdTemperatureFile,
  scenarioId: TempScenarioId,
  lat: number,
  lonE: number
): [number, number, number] {
  const tC = bilinearSample(
    dataset.scenarios[scenarioId].gridC,
    dataset.lats,
    dataset.lonsE,
    lat,
    lonE
  );
  return lerpColor(TEMP_COLOR_STOPS, tC);
}

// =========================================================================
// STORM, WIND & DUST-OPTICAL-DEPTH MODULE (MCD v6.2 + NASA Missions)
// =========================================================================

export interface StormBand {
  label: string;
  windSummary: string;
  dustSummary: string;
  hex: string;
  rgb: [number, number, number];
}

export const STORM_LEGEND_BANDS: StormBand[] = [
  {
    label: 'Calm / Low Wind',
    windSummary: '< 7 m/s (< 25 km/h)',
    dustSummary: 'Low dust (τ < 0.6)',
    hex: '#1D4ED8',
    rgb: [29, 78, 216]
  },
  {
    label: 'Light–Moderate Activity',
    windSummary: '7–12 m/s (25–43 km/h)',
    dustSummary: 'Light dust haze (τ 0.6–1.2)',
    hex: '#38BDF8',
    rgb: [56, 189, 248]
  },
  {
    label: 'Moderate Winds / Dusty',
    windSummary: '12–17 m/s (43–61 km/h)',
    dustSummary: 'Elevated dust (τ 1.2–1.9)',
    hex: '#FACC15',
    rgb: [250, 204, 21]
  },
  {
    label: 'Strong Winds / Active Storm',
    windSummary: '17–23 m/s (61–83 km/h)',
    dustSummary: 'Regional storm dust (τ 1.9–2.6)',
    hex: '#F97316',
    rgb: [249, 115, 22]
  },
  {
    label: 'Severe Storm Conditions',
    windSummary: '> 23 m/s (> 83 km/h)',
    dustSummary: 'Heavy dust loading (τ > 2.6)',
    hex: '#DC2626',
    rgb: [220, 38, 38]
  }
];

export function computeStormActivityScore(windMs: number, tau: number): number {
  const wNorm = Math.max(0, Math.min(1, windMs / 26));
  const tNorm = Math.max(0, Math.min(1, tau / 3.2));
  return 0.55 * wNorm + 0.45 * tNorm;
}

export function getStormBand(windMs: number, tau: number): StormBand {
  const s = computeStormActivityScore(windMs, tau);
  if (s < 0.22) return STORM_LEGEND_BANDS[0];
  if (s < 0.40) return STORM_LEGEND_BANDS[1];
  if (s < 0.58) return STORM_LEGEND_BANDS[2];
  if (s < 0.76) return STORM_LEGEND_BANDS[3];
  return STORM_LEGEND_BANDS[4];
}

export function formatWindDirection(uMs: number, vMs: number): {
  compassFrom: string;
  compassTo: string;
  degreesFrom: number;
  summary: string;
} {
  const speed = Math.hypot(uMs, vMs);
  if (speed < 0.4) {
    return {
      compassFrom: 'Variable',
      compassTo: 'Calm',
      degreesFrom: 0,
      summary: 'Light and variable'
    };
  }
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const degFrom = ((Math.atan2(-uMs, -vMs) * 180) / Math.PI + 360) % 360;
  const degTo = (degFrom + 180) % 360;
  const idxFrom = Math.round(degFrom / 22.5) % 16;
  const idxTo = Math.round(degTo / 22.5) % 16;
  return {
    compassFrom: dirs[idxFrom],
    compassTo: dirs[idxTo],
    degreesFrom: Math.round(degFrom),
    summary: `From ${dirs[idxFrom]} (${Math.round(degFrom)}°, blowing toward ${dirs[idxTo]})`
  };
}

export function describeStormConditions(
  windMs: number,
  tau: number,
  scenarioId: StormScenarioId
): string {
  const windDesc =
    windMs < 7
      ? 'gentle low-density Martian breeze'
      : windMs < 14
      ? 'steady surface flow'
      : windMs < 22
      ? 'strong wind jet capable of lifting fine surface dust'
      : 'high-velocity storm wind in very thin CO₂ air (~1% of Earth pressure)';

  const dustDesc =
    tau < 0.5
      ? 'relatively clear skies with minimal suspended dust'
      : tau < 1.2
      ? 'moderate atmospheric dust haze dimming direct sunlight'
      : tau < 2.5
      ? 'dense suspended dust cloud typical of regional/global dust storms'
      : 'heavy planet-encircling dust loading that sharply reduces solar irradiance and surface daytime warming';

  const contextTag =
    scenarioId === 'my34_storm'
      ? 'Captured from the historical June–July 2018 (MY 34) Global Dust Storm reconstruction.'
      : scenarioId === 'perihelion_storm'
      ? 'Represents southern-summer dust-storm season climatology near perihelion.'
      : 'Represents quiet clear-sky baseline conditions for comparison.';

  return `${windDesc.charAt(0).toUpperCase() + windDesc.slice(1)} paired with ${dustDesc}. ${contextTag}`;
}

export interface StormQueryResult {
  available: boolean;
  lat: number;
  lonE: number;
  windMs: number | null;
  windKmh: number | null;
  windDirection: string | null;
  tau: number | null;
  dustStatus: string | null;
  band: StormBand | null;
  locationName: string | null;
  regionNote: string | null;
  period: string;
  source: string;
  dataType: 'Modelled Atmospheric Climatology (MCD v6.2)' | 'Unavailable';
  conditionsSummary: string;
  nearestStation: { station: MeasuredStationRecord; distanceKm: number } | null;
  unavailableReason?: string;
}

export function queryStormAtPoint(
  lat: number,
  lonDeg: number,
  scenarioId: StormScenarioId,
  dataset: McdStormFile | null
): StormQueryResult {
  const lonE = normalizeLonE(lonDeg);
  const meta = STORM_SCENARIO_LIST.find((s) => s.id === scenarioId) ?? STORM_SCENARIO_LIST[0];
  const ctx = findLocationContext(lat, lonE);

  if (!dataset) {
    return {
      available: false,
      lat,
      lonE,
      windMs: null,
      windKmh: null,
      windDirection: null,
      tau: null,
      dustStatus: null,
      band: null,
      locationName: ctx.locationName,
      regionNote: ctx.regionNote,
      period: meta.period,
      source: 'Mars Climate Database v6.2 (LMD / ESA / NASA MRO MCS & Viking basis)',
      dataType: 'Unavailable',
      conditionsSummary: 'Wind and dust-storm dataset is loading or temporarily unavailable.',
      nearestStation: ctx.nearestStation,
      unavailableReason: 'Wind and dust-storm dataset is still loading or temporarily unavailable.'
    };
  }

  const scenario = dataset.scenarios[scenarioId];

  if (Math.abs(lat) > CLIMATE_COVERAGE_MAX_LAT || !Number.isFinite(lat)) {
    return {
      available: false,
      lat,
      lonE,
      windMs: null,
      windKmh: null,
      windDirection: null,
      tau: null,
      dustStatus: null,
      band: null,
      locationName: ctx.locationName,
      regionNote: ctx.regionNote,
      period: scenario.period,
      source: 'Mars Climate Database v6.2 (LMD / ESA / NASA MRO MCS & Viking basis)',
      dataType: 'Unavailable',
      conditionsSummary: 'Wind and dust-storm data unavailable for this polar edge location.',
      nearestStation: ctx.nearestStation,
      unavailableReason: 'Wind and dust-storm data unavailable for this location.'
    };
  }

  const windMs = Number(
    bilinearSample(scenario.windMs, dataset.lats, dataset.lonsE, lat, lonE).toFixed(1)
  );
  const uMs = bilinearSample(scenario.uMs, dataset.lats, dataset.lonsE, lat, lonE);
  const vMs = bilinearSample(scenario.vMs, dataset.lats, dataset.lonsE, lat, lonE);
  const tau = Number(
    bilinearSample(scenario.tau, dataset.lats, dataset.lonsE, lat, lonE).toFixed(2)
  );

  const dir = formatWindDirection(uMs, vMs);
  const band = getStormBand(windMs, tau);
  const dustStatus =
    tau < 0.5
      ? `Low dust haze (τ = ${tau})`
      : tau < 1.2
      ? `Mild suspended dust (τ = ${tau})`
      : tau < 2.2
      ? `Active dust-storm haze (τ = ${tau})`
      : `Severe dust loading (τ = ${tau})`;

  return {
    available: true,
    lat,
    lonE,
    windMs,
    windKmh: Number((windMs * 3.6).toFixed(1)),
    windDirection: dir.summary,
    tau,
    dustStatus,
    band,
    locationName: ctx.locationName,
    regionNote: ctx.regionNote,
    period: scenario.period,
    source: `${scenario.dustScenario} — LMD / ESA MCD v6.2 (10 m above surface)`,
    dataType: 'Modelled Atmospheric Climatology (MCD v6.2)',
    conditionsSummary: describeStormConditions(windMs, tau, scenarioId),
    nearestStation: ctx.nearestStation
  };
}

const STORM_COLOR_STOPS: { val: number; rgb: [number, number, number] }[] = [
  { val: 0.08, rgb: [29, 78, 216] }, // Blue (calm/low)
  { val: 0.30, rgb: [56, 189, 248] }, // Light blue (light-moderate)
  { val: 0.48, rgb: [250, 204, 21] }, // Yellow (moderate / dusty)
  { val: 0.67, rgb: [249, 115, 22] }, // Orange (strong winds / active storm)
  { val: 0.88, rgb: [220, 38, 38] } // Red (severe storm)
];

export function sampleStormPixelRgb(
  dataset: McdStormFile,
  scenarioId: StormScenarioId,
  lat: number,
  lonE: number
): [number, number, number] {
  const sc = dataset.scenarios[scenarioId];
  const w = bilinearSample(sc.windMs, dataset.lats, dataset.lonsE, lat, lonE);
  const t = bilinearSample(sc.tau, dataset.lats, dataset.lonsE, lat, lonE);
  const score = computeStormActivityScore(w, t);
  return lerpColor(STORM_COLOR_STOPS, score);
}

// =========================================================================
// TILE-LEVEL CLIMATE CANVAS RENDERER + LRU CACHE (ZERO TEXTURE LIMITS)
// =========================================================================

const climateTileCache = new Map<string, ImageData>();
const MAX_CACHED_TILES = 360;

export function drawClimateTile(
  canvas: HTMLCanvasElement,
  coords: { x: number; y: number; z: number },
  mode: 'temperature' | 'storm',
  scenarioId: string,
  tempDataset: McdTemperatureFile | null,
  stormDataset: McdStormFile | null
): boolean {
  const tileSize = 256;
  canvas.width = tileSize;
  canvas.height = tileSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  if (mode === 'temperature' && !tempDataset) return false;
  if (mode === 'storm' && !stormDataset) return false;

  const worldScale = 256 * Math.pow(2, coords.z);
  const minPxX = coords.x * tileSize;
  const minPxY = coords.y * tileSize;
  const maxPxY = minPxY + tileSize;

  const latTop = (0.5 - minPxY / worldScale) * 180;
  const latBot = (0.5 - maxPxY / worldScale) * 180;

  // Quick reject tiles completely outside [-85..85] latitude
  if (latBot > CLIMATE_COVERAGE_MAX_LAT || latTop < -CLIMATE_COVERAGE_MAX_LAT) {
    return true;
  }

  const cacheKey = `${mode}:${scenarioId}:${coords.z}:${coords.x}:${coords.y}`;
  const cached = climateTileCache.get(cacheKey);
  if (cached) {
    ctx.putImageData(cached, 0, 0);
    return true;
  }

  // Render at 128x128 resolution onto an ImageData and draw smoothly to 256x256
  const sampleSize = 128;
  const offscreen = document.createElement('canvas');
  offscreen.width = sampleSize;
  offscreen.height = sampleSize;
  const offCtx = offscreen.getContext('2d');
  if (!offCtx) return false;

  const img = offCtx.createImageData(sampleSize, sampleSize);
  const step = tileSize / sampleSize;

  for (let sy = 0; sy < sampleSize; sy++) {
    const py = minPxY + (sy + 0.5) * step;
    const lat = (0.5 - py / worldScale) * 180;
    const rowOffset = sy * sampleSize;
    if (lat > CLIMATE_COVERAGE_MAX_LAT || lat < -CLIMATE_COVERAGE_MAX_LAT) {
      continue;
    }
    for (let sx = 0; sx < sampleSize; sx++) {
      const px = minPxX + (sx + 0.5) * step;
      const lon = normalizeLonE((px / worldScale) * 180);

      const [r, g, b] =
        mode === 'temperature'
          ? sampleTemperaturePixelRgb(tempDataset!, scenarioId as TempScenarioId, lat, lon)
          : sampleStormPixelRgb(stormDataset!, scenarioId as StormScenarioId, lat, lon);

      const idx = (rowOffset + sx) * 4;
      img.data[idx] = r;
      img.data[idx + 1] = g;
      img.data[idx + 2] = b;
      img.data[idx + 3] = 178; // Semi-transparent over Viking surface relief
    }
  }

  offCtx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(offscreen, 0, 0, tileSize, tileSize);

  const fullImage = ctx.getImageData(0, 0, tileSize, tileSize);
  if (climateTileCache.size >= MAX_CACHED_TILES) {
    const oldestKey = climateTileCache.keys().next().value;
    if (oldestKey) climateTileCache.delete(oldestKey);
  }
  climateTileCache.set(cacheKey, fullImage);
  return true;
}
