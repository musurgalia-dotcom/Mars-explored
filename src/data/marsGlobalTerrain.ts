import globalMolaRaw from './marsGlobalMola.json';

const MARS_RADIUS_KM = 3389.5;

function normLon(lon: number): number {
  return ((lon % 360) + 360) % 360;
}

function sphericalKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * MARS_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface GlobalMolaGrid {
  source: string;
  rows: number;
  cols: number;
  latStepDeg: number;
  lonStepDeg: number;
  elevM: number[];
}

const MOLA_GRID = globalMolaRaw as GlobalMolaGrid;

// Bilinear interpolation of NASA MGS MOLA global elevation grid (meters relative to areoid datum)
export function getGlobalMolaElevationMeters(lat: number, lonDeg: number): number {
  const clampedLat = Math.max(-89, Math.min(89, lat));
  const lonE = normLon(lonDeg);

  // Row 0 = +89°N, Row 89 = -89°S
  const rExact = ((89 - clampedLat) / 178) * (MOLA_GRID.rows - 1);
  const r0 = Math.max(0, Math.min(MOLA_GRID.rows - 1, Math.floor(rExact)));
  const r1 = Math.min(MOLA_GRID.rows - 1, r0 + 1);
  const ty = rExact - r0;

  // Col 0 = 0°E, Col 179 = 358°E (wraps to 360°E = Col 0)
  const cExact = (lonE / 360) * MOLA_GRID.cols;
  const c0 = Math.floor(cExact) % MOLA_GRID.cols;
  const c1 = (c0 + 1) % MOLA_GRID.cols;
  const tx = cExact - Math.floor(cExact);

  const e00 = MOLA_GRID.elevM[r0 * MOLA_GRID.cols + c0];
  const e01 = MOLA_GRID.elevM[r0 * MOLA_GRID.cols + c1];
  const e10 = MOLA_GRID.elevM[r1 * MOLA_GRID.cols + c0];
  const e11 = MOLA_GRID.elevM[r1 * MOLA_GRID.cols + c1];

  const top = e00 * (1 - tx) + e01 * tx;
  const bot = e10 * (1 - tx) + e11 * tx;
  return Math.round(top * (1 - ty) + bot * ty);
}

// Regional MOLA slope magnitude (degrees) computed over ~1° baseline
export function getGlobalMolaSlopeDegrees(lat: number, lonDeg: number): number {
  const stepDeg = 1.2;
  const clampedLat = Math.max(-87, Math.min(87, lat));
  const lonE = normLon(lonDeg);

  const dzLatKm =
    (getGlobalMolaElevationMeters(clampedLat + stepDeg, lonE) -
      getGlobalMolaElevationMeters(clampedLat - stepDeg, lonE)) /
    1000;
  const dzLonKm =
    (getGlobalMolaElevationMeters(clampedLat, lonE + stepDeg) -
      getGlobalMolaElevationMeters(clampedLat, lonE - stepDeg)) /
    1000;

  const dyKm = Math.max(10, sphericalKm(clampedLat - stepDeg, lonE, clampedLat + stepDeg, lonE));
  const dxKm = Math.max(10, sphericalKm(clampedLat, lonE - stepDeg, clampedLat, lonE + stepDeg));

  const grad = Math.hypot(dzLonKm / dxKm, dzLatKm / dyKm);
  return Number((Math.atan(grad) * (180 / Math.PI)).toFixed(2));
}

export interface GlobalTerrainObstacle {
  id: string;
  name: string;
  type: 'canyon_scarp' | 'volcanic_edifice' | 'basin_rim' | 'fracture_zone';
  lat: number;
  lonE: number;
  radiusKm: number;
  coreRestrictedRatio: number; // fraction of radiusKm marked strictly restricted (0 = caution/high-cost only)
  penaltyWeight: number;
  dataset: string;
  hazardNote: string;
}

// Major planetary terrain hazards identified in MGS MOLA topography & USGS Geologic Map of Mars (SIM 3292)
export const GLOBAL_TERRAIN_OBSTACLES: GlobalTerrainObstacle[] = [
  {
    id: 'valles-west-ius',
    name: 'Valles Marineris (Ius / Melas Chasma Cliffs)',
    type: 'canyon_scarp',
    lat: -9.5,
    lonE: 282.5,
    radiusKm: 260,
    coreRestrictedRatio: 0.65,
    penaltyWeight: 18,
    dataset: 'MGS MOLA & USGS SIM 3292',
    hazardNote: '7 km deep tectonic rift cliffs, steep wall spurs, and massive landslide aprons.'
  },
  {
    id: 'valles-central-candor',
    name: 'Valles Marineris (Candor / Coprates Canyon)',
    type: 'canyon_scarp',
    lat: -13.2,
    lonE: 298.5,
    radiusKm: 280,
    coreRestrictedRatio: 0.65,
    penaltyWeight: 18,
    dataset: 'MGS MOLA & USGS SIM 3292',
    hazardNote: 'Steep 7–10 km canyon escarpments and unstable avalanche debris slopes.'
  },
  {
    id: 'valles-east-eos',
    name: 'Valles Marineris (Eos Chasma Outflow Trough)',
    type: 'canyon_scarp',
    lat: -13.5,
    lonE: 315.0,
    radiusKm: 240,
    coreRestrictedRatio: 0.6,
    penaltyWeight: 15,
    dataset: 'MGS MOLA & NASA Mars Trek',
    hazardNote: 'Deep catastrophic outflow chasm and fractured chaotic terrain blocks.'
  },
  {
    id: 'olympus-rupes',
    name: 'Olympus Mons Basal Scarp & Caldera',
    type: 'volcanic_edifice',
    lat: 18.65,
    lonE: 226.2,
    radiusKm: 310,
    coreRestrictedRatio: 0.45,
    penaltyWeight: 14,
    dataset: 'MGS MOLA & USGS SIM 3292',
    hazardNote: 'Up to 8 km sheer basal cliff (Olympus Rupes) and 21.9 km high volcanic flanks.'
  },
  {
    id: 'ascraeus-edifice',
    name: 'Ascraeus Mons Steep Volcanic Flanks',
    type: 'volcanic_edifice',
    lat: 11.9,
    lonE: 255.9,
    radiusKm: 220,
    coreRestrictedRatio: 0.38,
    penaltyWeight: 11,
    dataset: 'MGS MOLA & USGS SIM 3292',
    hazardNote: 'Steep +18.2 km shield volcano edifice and summit collapse calderas.'
  },
  {
    id: 'pavonis-edifice',
    name: 'Pavonis Mons Volcanic Edifice',
    type: 'volcanic_edifice',
    lat: 1.5,
    lonE: 247.0,
    radiusKm: 190,
    coreRestrictedRatio: 0.35,
    penaltyWeight: 10,
    dataset: 'MGS MOLA & USGS SIM 3292',
    hazardNote: 'High-relief Tharsis ridge volcano summit and fractured lava aprons.'
  },
  {
    id: 'arsia-edifice',
    name: 'Arsia Mons Caldera & Flank Scarps',
    type: 'volcanic_edifice',
    lat: -8.3,
    lonE: 239.9,
    radiusKm: 220,
    coreRestrictedRatio: 0.38,
    penaltyWeight: 11,
    dataset: 'MGS MOLA & USGS SIM 3292',
    hazardNote: 'Giant 110 km caldera rim cliffs and steep basaltic slope aprons.'
  },
  {
    id: 'elysium-mons-peak',
    name: 'Elysium Mons & Hecates Tholus Rise',
    type: 'volcanic_edifice',
    lat: 25.0,
    lonE: 147.2,
    radiusKm: 210,
    coreRestrictedRatio: 0.35,
    penaltyWeight: 9,
    dataset: 'MGS MOLA & USGS SIM 3292',
    hazardNote: 'Steep +12.6 km volcanic dome and radial trough incisions.'
  },
  {
    id: 'hellas-rim-west',
    name: 'Hellas Basin Western Rim Escarpment',
    type: 'basin_rim',
    lat: -41.0,
    lonE: 52.0,
    radiusKm: 260,
    coreRestrictedRatio: 0,
    penaltyWeight: 7.5,
    dataset: 'MGS MOLA Topography',
    hazardNote: 'Steep 9 km elevation drop from southern highlands into Hellas impact floor.'
  },
  {
    id: 'hellas-rim-east',
    name: 'Hellas Basin Eastern Rim & Dao Vallis',
    type: 'basin_rim',
    lat: -40.5,
    lonE: 90.0,
    radiusKm: 260,
    coreRestrictedRatio: 0,
    penaltyWeight: 7.5,
    dataset: 'MGS MOLA Topography',
    hazardNote: 'Steep canyon-cut rim scarps and lobate glacial debris aprons.'
  },
  {
    id: 'cerberus-fossae',
    name: 'Cerberus Fossae Tectonic Fissure System',
    type: 'fracture_zone',
    lat: 10.5,
    lonE: 158.0,
    radiusKm: 180,
    coreRestrictedRatio: 0,
    penaltyWeight: 6.5,
    dataset: 'MRO CTX / MOLA / USGS SIM 3292',
    hazardNote: 'Steep-walled graben fissures and active seismic fault scarps.'
  }
];

export interface GlobalAStarOutput {
  found: boolean;
  blockedReason?: string;
  waypoints: [number, number][];
  avoidedObstacles: string[];
}

// Check if a point lies inside a strictly restricted planetary canyon wall / volcano caldera core
export function findBlockingGlobalObstacle(lat: number, lonE: number): GlobalTerrainObstacle | null {
  const nLon = normLon(lonE);
  for (const ob of GLOBAL_TERRAIN_OBSTACLES) {
    if (ob.coreRestrictedRatio <= 0) continue;
    const d = sphericalKm(lat, nLon, ob.lat, ob.lonE);
    if (d <= ob.radiusKm * ob.coreRestrictedRatio) {
      return ob;
    }
  }
  return null;
}

// Compute terrain-aware global Mars A* route over the 180x90 (2°x2°) MOLA + USGS obstacle graph
export function runGlobalMarsAStar(
  startLat: number,
  startLonE: number,
  endLat: number,
  endLonE: number
): GlobalAStarOutput {
  const sLon = normLon(startLonE);
  const eLon = normLon(endLonE);

  // Do not treat extreme polar regions (>85°) as navigable terrain due to incomplete/extreme polar scarp coverage
  if (Math.abs(startLat) > 85.0 || Math.abs(endLat) > 85.0) {
    return {
      found: false,
      blockedReason:
        'No suitable route found: Mars Explorer orbital navigation coverage and surface terrain datasets are incomplete above 85° latitude (steep polar layered scarps and seasonal dry-ice hazards).',
      waypoints: [],
      avoidedObstacles: []
    };
  }

  const cols = MOLA_GRID.cols; // 180 (0..358°E in 2° steps)
  const rows = MOLA_GRID.rows; // 90 (+89°N down to -89°S in 2° steps)

  const toGrid = (lat: number, lon: number): [number, number] => {
    const r = Math.max(2, Math.min(rows - 3, Math.round(((89 - lat) / 178) * (rows - 1))));
    const c = ((Math.round(normLon(lon) / 2) % cols) + cols) % cols;
    return [r, c];
  };

  const toCoord = (r: number, c: number): [number, number] => [
    89 - (r / (rows - 1)) * 178,
    (c * 2) % 360
  ];

  const [sr, sc] = toGrid(startLat, sLon);
  const [er, ec] = toGrid(endLat, eLon);
  const startIdx = sr * cols + sc;
  const endIdx = er * cols + ec;

  // Build planetary traversal cost grid from MOLA elevation/slope + mapped USGS/MOLA obstacles
  const total = rows * cols;
  const cellCost = new Float32Array(total);
  const cellBlocked = new Uint8Array(total);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const [lat, lon] = toCoord(r, c);

      // Polar cap restriction (>85°)
      if (Math.abs(lat) > 85.0) {
        cellBlocked[idx] = 1;
        cellCost[idx] = 999;
        continue;
      }

      const slopeDeg = getGlobalMolaSlopeDegrees(lat, lon);
      let penalty = 1.0 + Math.min(12, slopeDeg * 0.85);
      // High-latitude (>72°) incomplete HiRISE/CTX reconnaissance uncertainty cost
      if (Math.abs(lat) > 72) penalty += 1.6;

      for (const ob of GLOBAL_TERRAIN_OBSTACLES) {
        const d = sphericalKm(lat, lon, ob.lat, ob.lonE);
        if (d < ob.radiusKm) {
          if (ob.coreRestrictedRatio > 0 && d < ob.radiusKm * ob.coreRestrictedRatio) {
            // Restrict canyon walls & sheer volcano calderas unless it is the user's chosen endpoint cell
            if (idx !== startIdx && idx !== endIdx) {
              cellBlocked[idx] = 1;
              penalty += 100;
            } else {
              penalty += ob.penaltyWeight;
            }
          } else {
            const factor = 1 - d / ob.radiusKm;
            penalty += ob.penaltyWeight * factor;
          }
        }
      }

      cellCost[idx] = penalty;
    }
  }

  // If start or end itself sits directly inside a hard restricted planetary canyon/scarp core, report unsafe instead of faking a path
  const startBlock = findBlockingGlobalObstacle(startLat, sLon);
  const endBlock = findBlockingGlobalObstacle(endLat, eLon);
  if (startBlock || endBlock) {
    const ob = startBlock ?? endBlock!;
    return {
      found: false,
      blockedReason: `No suitable route found: ${
        startBlock ? 'Starting point' : 'Destination'
      } lies inside ${ob.name} (${ob.dataset}), characterized by ${ob.hazardNote.toLowerCase()}`,
      waypoints: [],
      avoidedObstacles: [ob.name]
    };
  }

  const gScore = new Float64Array(total).fill(Infinity);
  const fScore = new Float64Array(total).fill(Infinity);
  const cameFrom = new Int32Array(total).fill(-1);
  const closed = new Uint8Array(total);
  const inOpen = new Uint8Array(total);

  gScore[startIdx] = 0;
  fScore[startIdx] = sphericalKm(startLat, sLon, endLat, eLon);
  const open: number[] = [startIdx];
  inOpen[startIdx] = 1;

  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1]
  ];

  while (open.length > 0) {
    let bestPos = 0;
    for (let i = 1; i < open.length; i++) {
      if (fScore[open[i]] < fScore[open[bestPos]]) bestPos = i;
    }
    const curr = open.splice(bestPos, 1)[0];
    if (curr === endIdx) break;
    closed[curr] = 1;

    const cr = Math.floor(curr / cols);
    const cc = curr % cols;
    const [cLat, cLon] = toCoord(cr, cc);
    const cElev = getGlobalMolaElevationMeters(cLat, cLon);

    for (const [dr, dc] of dirs) {
      const nr = cr + dr;
      if (nr < 1 || nr >= rows - 1) continue;
      // Wrap horizontally across Mars 0°/360° prime meridian
      const nc = (cc + dc + cols) % cols;
      const nIdx = nr * cols + nc;
      if (closed[nIdx] || cellBlocked[nIdx]) continue;

      const [nLat, nLon] = toCoord(nr, nc);
      const stepDist = sphericalKm(cLat, cLon, nLat, nLon);
      const nElev = getGlobalMolaElevationMeters(nLat, nLon);
      const stepSlopeDeg =
        (Math.atan(Math.abs(nElev - cElev) / Math.max(1000, stepDist * 1000)) * 180) / Math.PI;

      // Combine terrain cell cost + direct step elevation change gradient penalty
      const avgCellPenalty = 0.5 * (cellCost[curr] + cellCost[nIdx]);
      const stepCost = stepDist * (avgCellPenalty + stepSlopeDeg * 0.7);
      const tentativeG = gScore[curr] + stepCost;

      if (tentativeG < gScore[nIdx]) {
        cameFrom[nIdx] = curr;
        gScore[nIdx] = tentativeG;
        fScore[nIdx] = tentativeG + sphericalKm(nLat, nLon, endLat, eLon);
        if (!inOpen[nIdx]) {
          open.push(nIdx);
          inOpen[nIdx] = 1;
        }
      }
    }
  }

  if (cameFrom[endIdx] === -1 && startIdx !== endIdx) {
    return {
      found: false,
      blockedReason:
        'No suitable navigable route found between these coordinates without crossing restricted cliffs, canyon scarps, or incomplete high-latitude coverage.',
      waypoints: [],
      avoidedObstacles: []
    };
  }

  const rawPoints: [number, number][] = [];
  let trace = endIdx;
  while (trace !== -1) {
    const r = Math.floor(trace / cols);
    const c = trace % cols;
    rawPoints.push(toCoord(r, c));
    if (trace === startIdx) break;
    trace = cameFrom[trace];
  }
  rawPoints.reverse();

  const waypoints: [number, number][] =
    rawPoints.length >= 2
      ? [[startLat, sLon], ...rawPoints.slice(1, -1), [endLat, eLon]]
      : [
          [startLat, sLon],
          [endLat, eLon]
        ];

  // Determine which planetary obstacles lay near the straight line and were detoured around
  const avoidedObstacles: string[] = [];
  let dLon = eLon - sLon;
  if (dLon > 180) dLon -= 360;
  if (dLon < -180) dLon += 360;

  for (const ob of GLOBAL_TERRAIN_OBSTACLES) {
    let minStraightDist = Infinity;
    for (let k = 0; k <= 24; k++) {
      const t = k / 24;
      const lat = startLat + (endLat - startLat) * t;
      const lon = normLon(sLon + dLon * t);
      minStraightDist = Math.min(minStraightDist, sphericalKm(lat, lon, ob.lat, ob.lonE));
    }
    if (minStraightDist < ob.radiusKm * 1.1) {
      let minRouteDist = Infinity;
      for (const [wLat, wLon] of waypoints) {
        minRouteDist = Math.min(minRouteDist, sphericalKm(wLat, wLon, ob.lat, ob.lonE));
      }
      if (minRouteDist > minStraightDist + 18) {
        avoidedObstacles.push(`${ob.name} (${ob.dataset})`);
      }
    }
  }

  return {
    found: true,
    waypoints,
    avoidedObstacles
  };
}
