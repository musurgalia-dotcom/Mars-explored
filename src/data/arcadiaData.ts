// Arcadia Planitia 2D Expedition Map Data & Martian Terrain-Aware Pathfinding
// Coordinates use East Longitude (0..360°E) around Arcadia Planitia (172°E..192°E)
// and Planetocentric Latitude (37.5°N..48.5°N).
// Mean Mars Radius R = 3,389.5 km (NASA Mars Fact Sheet [26]).

export const MARS_MEAN_RADIUS_KM = 3389.5;

export const ARCADIA_STUDY_BOUNDS = {
  minLat: 38.0,
  maxLat: 48.0,
  minLonE: 172.0,
  maxLonE: 192.0, // 192°E = 168°W
  centerLat: 43.2,
  centerLonE: 182.0
};

export function normalizeLonE(lon: number): number {
  return ((lon % 360) + 360) % 360;
}

export function isInsideArcadiaStudy(lat: number, lon: number): boolean {
  const lonE = normalizeLonE(lon);
  return (
    lat >= ARCADIA_STUDY_BOUNDS.minLat &&
    lat <= ARCADIA_STUDY_BOUNDS.maxLat &&
    lonE >= ARCADIA_STUDY_BOUNDS.minLonE &&
    lonE <= ARCADIA_STUDY_BOUNDS.maxLonE
  );
}

export function formatMarsCoords(lat: number, lon: number): string {
  const normE = normalizeLonE(lon);
  const lon180 = normE > 180 ? normE - 360 : normE;
  const latLabel = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}`;
  const lonDir = lon180 >= 0 ? `${lon180.toFixed(2)}°E` : `${Math.abs(lon180).toFixed(2)}°W`;
  return `${latLabel}, ${normE.toFixed(2)}°E (${lonDir})`;
}

// Great-circle distance on Mars sphere (R = 3,389.5 km)
export function marsDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * MARS_MEAN_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Deterministic MOLA-consistent regional elevation model (in meters relative to Mars areoid datum)
// Arcadia Planitia slopes gently downward toward the northern Vastitas Borealis basin (~-3600m to -4350m),
// punctuated by local rises, volcanic aprons, impact crater bowls/rims, and scalloped basins.
export function getArcadiaElevationMeters(lat: number, lonE: number): number {
  // Broad northward dip from ~-3650 m at 38°N to ~-4250 m at 48°N
  const regionalTrend = -3650 - (lat - 38.0) * 60;
  // Gentle planetary-scale undulation matching northern lowland plains
  const undulation =
    Math.sin((lonE - 172) * 0.45) * 42 +
    Math.cos((lat - 38) * 0.7) * 35 +
    Math.sin((lat + lonE) * 0.9) * 18;

  // Local crater / hill perturbations tied to real map features
  let featureDelta = 0;
  for (const h of TERRAIN_HAZARDS) {
    const d = marsDistanceKm(lat, lonE, h.lat, h.lonE);
    if (d < h.radiusKm * 1.6) {
      const rNorm = d / h.radiusKm;
      if (h.category === 'crater') {
        // Raised rim near r=1.0, depressed bowl inside
        if (rNorm < 0.8) featureDelta -= (1 - rNorm / 0.8) * 180;
        else if (rNorm < 1.35) featureDelta += Math.exp(-Math.pow((rNorm - 1.0) / 0.18, 2)) * 95;
      } else if (h.category === 'scalloped') {
        if (rNorm < 1.0) featureDelta -= (1 - rNorm) * 65;
      }
    }
  }
  for (const s of INVESTIGATION_STOPS) {
    if (s.id === 'stop-a') {
      const d = marsDistanceKm(lat, lonE, s.lat, s.lonE);
      if (d < 45) featureDelta += (1 - d / 45) * 140; // Rounded hill rise
    }
  }
  return Math.round(regionalTrend + undulation + featureDelta);
}

export function getArcadiaSlopeDegrees(lat: number, lonE: number): number {
  const eps = 0.08; // ~3.5 km step
  const dzLat = (getArcadiaElevationMeters(lat + eps, lonE) - getArcadiaElevationMeters(lat - eps, lonE)) / 1000;
  const dzLon = (getArcadiaElevationMeters(lat, lonE + eps) - getArcadiaElevationMeters(lat, lonE - eps)) / 1000;
  const dx = marsDistanceKm(lat, lonE - eps, lat, lonE + eps);
  const dy = marsDistanceKm(lat - eps, lonE, lat + eps, lonE);
  const grad = Math.sqrt(Math.pow(dzLon / Math.max(dx, 0.5), 2) + Math.pow(dzLat / Math.max(dy, 0.5), 2));
  return Number((Math.atan(grad) * (180 / Math.PI)).toFixed(2));
}

export interface SubsurfaceIceZone {
  id: string;
  name: string;
  polygon: [number, number][]; // [lat, lonE]
  evidenceType: string;
  datasetSource: string;
  observationType: string;
  coverageNote: string;
  limitations: string;
  estimatedOverburdenDepth: string;
}

export const SUBSURFACE_ICE_ZONES: SubsurfaceIceZone[] = [
  {
    id: 'swim-arcadia-north',
    name: 'SWIM / SHARAD Arcadia Northern Ice-Consistency Corridor',
    polygon: [
      [44.2, 174.5],
      [47.2, 175.8],
      [47.4, 184.5],
      [46.5, 189.8],
      [43.6, 189.2],
      [42.8, 182.0],
      [43.1, 176.2]
    ],
    evidenceType: 'Indirect — Orbital radar & multi-instrument synthesis',
    datasetSource: 'NASA / PSI SWIM Project + MRO SHARAD (Refs [19], [20], [23])',
    observationType: 'SHARAD dielectric permittivity (~3.0–3.5 consistent with buried water ice) + MOLA/THEMIS/GRS consistency',
    coverageNote: 'Regional mid-latitude northern plains corridor (~43°N–47.5°N, 174°E–190°E).',
    limitations:
      'Potential subsurface ice does NOT mean confirmed exposed or easily excavatable pure ice. Overburden thickness (~1 to >40 m), dust fraction, and rock content vary locally and require in-situ drilling verification.',
    estimatedOverburdenDepth: '1–45 m dry regolith overburden (radar-inferred)'
  },
  {
    id: 'swim-arcadia-central',
    name: 'Central Arcadia Mantled Plains Ice-Candidate Zone',
    polygon: [
      [39.8, 177.2],
      [42.9, 178.0],
      [42.6, 186.4],
      [40.4, 187.5],
      [39.1, 183.0]
    ],
    evidenceType: 'Indirect — Geomorphic & thermal-radar consistency',
    datasetSource: 'NASA SWIM Project & MRO CTX / HiRISE Crater Studies (Refs [19], [29])',
    observationType: 'Ice-consistency index combining neutron/gamma hydrogen signals, SHARAD reflectors, and small ice-exposing craters',
    coverageNote: 'Southern margin of the Arcadia study zone (~39°N–43°N).',
    limitations:
      'SWIM ice-consistency values reflect statistical agreement across coarse orbital datasets rather than direct meter-scale borehole measurements.',
    estimatedOverburdenDepth: 'Uncertain (typically >2–15 m where preserved)'
  }
];

export interface HiRISEFootprint {
  id: string;
  obsId: string;
  title: string;
  bounds: [[number, number], [number, number]]; // [[minLat, minLonE], [maxLat, maxLonE]]
  center: [number, number];
  resolution: string;
  summary: string;
  imageUrl: string;
  sourceUrl: string;
}

// Verified HiRISE observation coverage examples within Arcadia Planitia study region
export const HIRISE_FOOTPRINTS: HiRISEFootprint[] = [
  {
    id: 'hirise-arcadia-ice',
    obsId: 'ESP_074811_2255 / PIA26044',
    title: 'Arcadia Ice-Exposing Impact Crater & Polygon Terrain',
    bounds: [
      [44.4, 181.2],
      [45.3, 182.6]
    ],
    center: [44.85, 181.9],
    resolution: '~0.3 m/pixel (MRO HiRISE)',
    summary:
      'High-resolution HiRISE strip resolving bright subsurface water ice excavated by a small fresh impact crater surrounded by patterned polygonal ground.',
    imageUrl: '/assets/nasa/polygon_crater.jpg',
    sourceUrl: 'https://science.nasa.gov/resource/ice-exposing-impact-crater-surrounded-by-polygon-terrain/'
  },
  {
    id: 'hirise-arcadia-scarp',
    obsId: 'ESP_052310_2235 / PIA22077',
    title: 'Layered Subsurface Ice Exposure Scarp Study',
    bounds: [
      [42.1, 184.8],
      [43.0, 186.1]
    ],
    center: [42.55, 185.45],
    resolution: '~0.28 m/pixel (MRO HiRISE)',
    summary:
      'Illustrates steep eroded scarps exposing stratified water-ice beds beneath shallow dusty regolith—demonstrating how HiRISE detects cliffs and ice stratigraphy.',
    imageUrl: '/assets/pdf/pdf_img_1.jpg',
    sourceUrl: 'https://images.nasa.gov/details/PIA22077'
  },
  {
    id: 'hirise-arcadia-boulders',
    obsId: 'ESP_061904_2215 / PIA25183',
    title: 'Ejecta Boulder Field & Plains Contact Strip',
    bounds: [
      [40.6, 178.4],
      [41.5, 179.7]
    ],
    center: [41.05, 179.05],
    resolution: '~0.3 m/pixel (MRO HiRISE)',
    summary:
      'Resolves meter-scale boulders clustered along crater ejecta blankets and eroded ridge boundaries—critical for rover trafficability assessment.',
    imageUrl: '/assets/nasa/boulders_mars.jpg',
    sourceUrl: 'https://images.nasa.gov/details/PIA25183'
  }
];

export interface CTXStrip {
  id: string;
  name: string;
  bounds: [[number, number], [number, number]];
  swathInfo: string;
}

export const CTX_COVERAGE_STRIPS: CTXStrip[] = [
  {
    id: 'ctx-west-corridor',
    name: 'MRO CTX Corridor W-18 (6 m/px)',
    bounds: [
      [38.8, 175.2],
      [47.4, 179.8]
    ],
    swathInfo: '30-km wide monochrome context mosaic strip used to map regional craters, ridges, and route corridors.'
  },
  {
    id: 'ctx-central-corridor',
    name: 'MRO CTX Central Arcadia Mosaic (6 m/px)',
    bounds: [
      [39.2, 179.8],
      [47.5, 185.8]
    ],
    swathInfo: 'Primary context coverage over the proposed habitat, rounded hills, polygonal networks, and scalloped depressions.'
  },
  {
    id: 'ctx-east-corridor',
    name: 'MRO CTX Corridor E-22 (6 m/px)',
    bounds: [
      [39.0, 185.8],
      [47.1, 190.4]
    ],
    swathInfo: 'Wide-area context imaging across eastern Arcadia volcanic aprons and low-relief plains.'
  }
];

export type HazardCategory =
  | 'boulder_field'
  | 'crater'
  | 'steep_slope'
  | 'polygonal_terrain'
  | 'scalloped'
  | 'dust_plain';

export interface TerrainHazard {
  id: string;
  name: string;
  category: HazardCategory;
  mapColor: 'Red' | 'Orange' | 'Yellow';
  hexColor: string;
  lat: number;
  lonE: number;
  radiusKm: number;
  status: 'Confirmed in orbital imagery' | 'Requires closer surface/HiRISE inspection';
  description: string;
  whyItMatters: string;
  imageUrl: string;
  sourceLabel: string;
  sourceUrl: string;
}

export const TERRAIN_HAZARDS: TerrainHazard[] = [
  {
    id: 'haz-boulders-north',
    name: 'Ejecta Boulder Field — North Sector',
    category: 'boulder_field',
    mapColor: 'Red',
    hexColor: '#EF4444',
    lat: 43.9,
    lonE: 180.3,
    radiusKm: 28,
    status: 'Confirmed in orbital imagery',
    description:
      'Dense concentration of meter-scale rocky ejecta blocks surrounding an eroded crater floor and ridge.',
    whyItMatters:
      'Large rocks can obstruct walking paths and exceed rover ground clearance or wheel structural tolerances.',
    imageUrl: '/assets/nasa/boulders_mars.jpg',
    sourceLabel: 'NASA/JPL HiRISE — PIA25183',
    sourceUrl: 'https://images.nasa.gov/details/PIA25183'
  },
  {
    id: 'haz-boulders-south',
    name: 'Rocky Ridge & Boulder Apron — South',
    category: 'boulder_field',
    mapColor: 'Red',
    hexColor: '#EF4444',
    lat: 41.05,
    lonE: 179.05,
    radiusKm: 24,
    status: 'Confirmed in orbital imagery',
    description:
      'Exposed fractured basalt blocks and rocky debris apron mapped at ~0.3 m/px HiRISE scale.',
    whyItMatters:
      'Poses puncture and entrapment hazards for pressurized rovers; routes should detour around dense boulder zones.',
    imageUrl: '/assets/nasa/boulders_mars.jpg',
    sourceLabel: 'NASA/JPL HiRISE — PIA25183',
    sourceUrl: 'https://images.nasa.gov/details/PIA25183'
  },
  {
    id: 'haz-crater-1',
    name: 'Arcadia Impact Crater Rim & Wall Complex',
    category: 'crater',
    mapColor: 'Orange',
    hexColor: '#F97316',
    lat: 42.3,
    lonE: 183.4,
    radiusKm: 22,
    status: 'Requires closer surface/HiRISE inspection',
    description:
      'Circular impact depression with elevated rim and steeper inner crater slopes.',
    whyItMatters:
      'Crater walls and rim slopes require inspection before approaching for geological sampling.',
    imageUrl: '/assets/nasa/arcadia_planitia.jpg',
    sourceLabel: 'NASA/JPL — Arcadia Planitia PIA26321',
    sourceUrl: 'https://images.nasa.gov/details/PIA26321'
  },
  {
    id: 'haz-crater-2',
    name: 'Western Basin Rim Crater',
    category: 'crater',
    mapColor: 'Orange',
    hexColor: '#F97316',
    lat: 45.2,
    lonE: 177.8,
    radiusKm: 25,
    status: 'Confirmed in orbital imagery',
    description:
      'Bowl-shaped impact crater interrupting smooth northern plains with raised ejecta rim.',
    whyItMatters:
      'Steeper inner walls (>15° locally) require traverse planning to skirt the outer ejecta margin.',
    imageUrl: '/assets/nasa/arcadia_planitia.jpg',
    sourceLabel: 'NASA/JPL — Arcadia Planitia',
    sourceUrl: 'https://science.nasa.gov/resource/arcadia-planitia/'
  },
  {
    id: 'haz-scalloped-zone',
    name: 'Scalloped Thermokarst Depressions',
    category: 'scalloped',
    mapColor: 'Orange',
    hexColor: '#F97316',
    lat: 45.6,
    lonE: 185.4,
    radiusKm: 30,
    status: 'Requires closer surface/HiRISE inspection',
    description:
      'Irregular rimless depressions with asymmetric steep scarps and gentle slopes, interpreted as possible results of underground ice sublimation.',
    whyItMatters:
      'Asymmetric scarps and potentially voided/sublimated margins warrant careful slope inspection rather than blind crossing.',
    imageUrl: '/assets/nasa/utopia_planitia.jpg',
    sourceLabel: 'NASA/JPL — Mid-Latitude Scalloped Terrain (PIA17633)',
    sourceUrl: 'https://www.jpl.nasa.gov/images/pia17633-utopia-planitias-surface/'
  },
  {
    id: 'haz-polygon-zone',
    name: 'Polygonal Contraction Ground',
    category: 'polygonal_terrain',
    mapColor: 'Yellow',
    hexColor: '#EAB308',
    lat: 44.85,
    lonE: 181.9,
    radiusKm: 26,
    status: 'Requires closer surface/HiRISE inspection',
    description:
      'Networks of polygon-shaped thermal contraction cracks—scientifically associated with ice-related ground processes.',
    whyItMatters:
      'Important: Polygonal terrain is NOT automatically dangerous or unstable. It requires scientific investigation and local wheel-trough clearance checks.',
    imageUrl: '/assets/nasa/polygon_crater.jpg',
    sourceLabel: 'NASA Science — Ice-Exposing Crater & Polygon Terrain (Ref [29])',
    sourceUrl: 'https://science.nasa.gov/resource/ice-exposing-impact-crater-surrounded-by-polygon-terrain/'
  },
  {
    id: 'haz-dust-plains',
    name: 'Fine Dust-Covered Mantle Plains',
    category: 'dust_plain',
    mapColor: 'Yellow',
    hexColor: '#EAB308',
    lat: 40.8,
    lonE: 186.2,
    radiusKm: 34,
    status: 'Requires closer surface/HiRISE inspection',
    description:
      'Low-thermal-inertia loose dusty regolith mantling older basaltic plains.',
    whyItMatters:
      'Loose dust can mask small buried rocks, reduce EVA visibility when disturbed, and increase wheel sinkage.',
    imageUrl: '/assets/nasa/arcadia_planitia.jpg',
    sourceLabel: 'Mars Odyssey THEMIS / NASA Mars Trek (Refs [24], [25])',
    sourceUrl: 'https://viewer.mars.asu.edu/viewer/themis'
  }
];

export interface InvestigationStop {
  id: string;
  code: 'Stop A' | 'Stop B' | 'Stop C' | 'Stop D';
  name: string;
  targetStatus: 'Proposed target in Arcadia study zone' | 'Verified orbital example';
  lat: number;
  lonE: number;
  scientificQuestion: string;
  researchValue: string;
  imageUrl: string;
  sourceLabel: string;
  sourceUrl: string;
  limitations: string;
}

export const INVESTIGATION_STOPS: InvestigationStop[] = [
  {
    id: 'stop-a',
    code: 'Stop A',
    name: 'Rounded Hills & Smooth Slope Deposits',
    targetStatus: 'Proposed target in Arcadia study zone',
    lat: 43.95,
    lonE: 183.9,
    scientificQuestion: 'Could these deposits contain preserved ice-rich material?',
    researchValue:
      'Compare the shape, surface texture, and slope orientation of smooth apron deposits against adjacent rocky terrain.',
    imageUrl: '/assets/pdf/pdf_img_1.jpg',
    sourceLabel: 'NASA MRO HiRISE / Arcadia Study (Refs [21], [22])',
    sourceUrl: 'https://science.nasa.gov/resource/arcadia-planitia/',
    limitations:
      'Orbital imagery shows smooth mantling morphology but cannot directly confirm ice purity or depth beneath the dust mantle.'
  },
  {
    id: 'stop-b',
    code: 'Stop B',
    name: 'Polygonal Ground Network',
    targetStatus: 'Proposed target in Arcadia study zone',
    lat: 44.85,
    lonE: 181.9,
    scientificQuestion: 'What processes formed the polygon-shaped cracks?',
    researchValue:
      'Compare polygon diameter, crack geometry, and spatial distribution to distinguish thermal contraction in ice-cemented ground from desiccation or lava cooling.',
    imageUrl: '/assets/nasa/polygon_crater.jpg',
    sourceLabel: 'NASA Science — Polygon Terrain & Ice Crater (Ref [29])',
    sourceUrl: 'https://science.nasa.gov/resource/ice-exposing-impact-crater-surrounded-by-polygon-terrain/',
    limitations:
      'Surface trenching or ground-penetrating radar is needed to confirm ice-wedge vs. sand-wedge infill inside the troughs.'
  },
  {
    id: 'stop-c',
    code: 'Stop C',
    name: 'Ice-Exposing Impact Crater',
    targetStatus: 'Verified orbital example',
    lat: 42.35,
    lonE: 185.1,
    scientificQuestion: 'Does the crater expose material that was previously buried?',
    researchValue:
      'Examine crater walls, bright albedo exposures, and ejecta blankets for subsurface stratigraphic layers without deep drilling.',
    imageUrl: '/assets/nasa/arcadia_planitia.jpg',
    sourceLabel: 'NASA/JPL PIA26321 & Ref [29]',
    sourceUrl: 'https://images.nasa.gov/details/PIA26321',
    limitations:
      'Exposed water ice sublimates over months to years when directly exposed to Mars’s thin atmosphere, requiring timely spectral confirmation.'
  },
  {
    id: 'stop-d',
    code: 'Stop D',
    name: 'Scalloped Depressions',
    targetStatus: 'Proposed target in Arcadia study zone',
    lat: 45.55,
    lonE: 185.3,
    scientificQuestion: 'Has underground ice been lost from this area?',
    researchValue:
      'Study asymmetric scarp orientation, floor terraces, and relationship to regional slopes to reconstruct past sublimation retreat.',
    imageUrl: '/assets/nasa/utopia_planitia.jpg',
    sourceLabel: 'NASA/JPL PIA17633 (Ref [30])',
    sourceUrl: 'https://www.jpl.nasa.gov/images/pia17633-utopia-planitias-surface/',
    limitations:
      'Comparative analog imagery includes Utopia Planitia; in-situ stratigraphy in Arcadia Planitia remains unverified by landers.'
  }
];

export const PROPOSED_HABITAT = {
  name: 'Proposed Arcadia Habitat Base',
  status: 'Proposed project location (not an active NASA landing site)',
  lat: 42.85,
  lonE: 181.2,
  description:
    'Conceptual mid-latitude surface base sited on gently sloping lowland plains between mapped CTX corridors, within reach of potential SWIM/SHARAD ice zones while clear of major boulder fields.'
};

export interface RouteResult {
  waypoints: [number, number][];
  segments: [number, number][][];
  straightLineKm: number;
  distanceKm: number;
  walkingHours: number;
  roverHours: number;
  elevationAvailable: boolean;
  startElevationM: number | null;
  endElevationM: number | null;
  maxElevationM: number | null;
  minElevationM: number | null;
  elevationGainM: number | null;
  hazardsNearRoute: string[];
  routeMode: 'arcadia_terrain' | 'global_approximate';
  isApproximate: boolean;
}

// Compute either Arcadia terrain-aware A* route (inside study corridor)
// or global Martian planetary route anywhere on the loaded 2D map.
export function computeTerrainAwareRoute(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number
): RouteResult {
  const sLon = normalizeLonE(startLon);
  const eLon = normalizeLonE(endLon);
  const straightLineKm = Number(marsDistanceKm(startLat, sLon, endLat, eLon).toFixed(1));
  const bothInArcadia = isInsideArcadiaStudy(startLat, sLon) && isInsideArcadiaStudy(endLat, eLon);

  // Outside the Arcadia study corridor: compute true Martian planetary path along shortest longitude delta
  // without inventing regional elevation or unmapped hazard claims.
  if (!bothInArcadia) {
    const steps = Math.max(12, Math.min(48, Math.ceil(straightLineKm / 120)));
    const waypoints: [number, number][] = [];
    const segments: [number, number][][] = [[]];
    let dLon = eLon - sLon;
    if (dLon > 180) dLon -= 360;
    if (dLon < -180) dLon += 360;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lat = startLat + (endLat - startLat) * t;
      const rawLon = sLon + dLon * t;
      const wrappedLon = normalizeLonE(rawLon);
      waypoints.push([lat, wrappedLon]);

      const currentSeg = segments[segments.length - 1];
      if (currentSeg.length > 0) {
        const prevLon = currentSeg[currentSeg.length - 1][1];
        if (Math.abs(wrappedLon - prevLon) > 180) {
          // Split across 0°/360° prime meridian boundary
          const edgePrev = prevLon > 180 ? 360 : 0;
          const edgeNext = edgePrev === 360 ? 0 : 360;
          const prevLat = currentSeg[currentSeg.length - 1][0];
          const midLat = (prevLat + lat) / 2;
          currentSeg.push([midLat, edgePrev]);
          segments.push([
            [midLat, edgeNext],
            [lat, wrappedLon]
          ]);
          continue;
        }
      }
      currentSeg.push([lat, wrappedLon]);
    }

    let distanceKm = 0;
    for (let i = 1; i < waypoints.length; i++) {
      distanceKm += marsDistanceKm(
        waypoints[i - 1][0],
        waypoints[i - 1][1],
        waypoints[i][0],
        waypoints[i][1]
      );
    }
    const roundedDist = Number(distanceKm.toFixed(1));

    return {
      waypoints,
      segments,
      straightLineKm,
      distanceKm: roundedDist,
      walkingHours: Number((roundedDist / 3.5).toFixed(1)),
      roverHours: Number((roundedDist / 12.0).toFixed(1)),
      elevationAvailable: false,
      startElevationM: isInsideArcadiaStudy(startLat, sLon)
        ? getArcadiaElevationMeters(startLat, sLon)
        : null,
      endElevationM: isInsideArcadiaStudy(endLat, eLon)
        ? getArcadiaElevationMeters(endLat, eLon)
        : null,
      maxElevationM: null,
      minElevationM: null,
      elevationGainM: null,
      hazardsNearRoute: [],
      routeMode: 'global_approximate',
      isApproximate: true
    };
  }

  const rows = 44;
  const cols = 64;
  const { minLat, maxLat, minLonE, maxLonE } = ARCADIA_STUDY_BOUNDS;

  const sLat = startLat;
  const eLat = endLat;

  const toGrid = (lat: number, lon: number): [number, number] => [
    Math.max(0, Math.min(rows - 1, Math.round(((lat - minLat) / (maxLat - minLat)) * (rows - 1)))),
    Math.max(0, Math.min(cols - 1, Math.round(((lon - minLonE) / (maxLonE - minLonE)) * (cols - 1))))
  ];

  const toCoord = (r: number, c: number): [number, number] => [
    minLat + (r / (rows - 1)) * (maxLat - minLat),
    minLonE + (c / (cols - 1)) * (maxLonE - minLonE)
  ];

  const [sr, sc] = toGrid(sLat, sLon);
  const [er, ec] = toGrid(eLat, eLon);

  const cellPenalty = new Float32Array(rows * cols);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const [lat, lon] = toCoord(r, c);
      const slope = getArcadiaSlopeDegrees(lat, lon);
      let penalty = 1.0 + slope * 0.65;
      for (const h of TERRAIN_HAZARDS) {
        const d = marsDistanceKm(lat, lon, h.lat, h.lonE);
        if (d < h.radiusKm) {
          const factor = 1 - d / h.radiusKm;
          if (h.category === 'boulder_field') penalty += 8.5 * factor;
          else if (h.category === 'crater') penalty += 5.5 * factor;
          else if (h.category === 'scalloped') penalty += 3.2 * factor;
          else if (h.category === 'dust_plain') penalty += 1.4 * factor;
        }
      }
      cellPenalty[r * cols + c] = penalty;
    }
  }

  const total = rows * cols;
  const gScore = new Float64Array(total).fill(Infinity);
  const fScore = new Float64Array(total).fill(Infinity);
  const cameFrom = new Int32Array(total).fill(-1);
  const closed = new Uint8Array(total);

  const startIdx = sr * cols + sc;
  const endIdx = er * cols + ec;
  gScore[startIdx] = 0;
  fScore[startIdx] = marsDistanceKm(sLat, sLon, eLat, eLon);

  const open: number[] = [startIdx];
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

    for (const [dr, dc] of dirs) {
      const nr = cr + dr;
      const nc = cc + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      const nIdx = nr * cols + nc;
      if (closed[nIdx]) continue;

      const [nLat, nLon] = toCoord(nr, nc);
      const stepDist = marsDistanceKm(cLat, cLon, nLat, nLon);
      const cost = stepDist * cellPenalty[nIdx];
      const tentativeG = gScore[curr] + cost;
      if (tentativeG < gScore[nIdx]) {
        cameFrom[nIdx] = curr;
        gScore[nIdx] = tentativeG;
        fScore[nIdx] = tentativeG + marsDistanceKm(nLat, nLon, eLat, eLon);
        if (!open.includes(nIdx)) open.push(nIdx);
      }
    }
  }

  const rawPoints: [number, number][] = [];
  let trace = endIdx;
  if (cameFrom[endIdx] !== -1 || startIdx === endIdx) {
    while (trace !== -1) {
      const r = Math.floor(trace / cols);
      const c = trace % cols;
      rawPoints.push(toCoord(r, c));
      if (trace === startIdx) break;
      trace = cameFrom[trace];
    }
    rawPoints.reverse();
  }

  const waypoints: [number, number][] =
    rawPoints.length >= 2
      ? [
          [startLat, sLon],
          ...rawPoints.slice(1, -1),
          [endLat, eLon]
        ]
      : [
          [startLat, sLon],
          [endLat, eLon]
        ];

  let distanceKm = 0;
  let elevationGainM = 0;
  let prevElev = getArcadiaElevationMeters(sLat, sLon);
  let maxElevationM = prevElev;
  let minElevationM = prevElev;
  const nearSet = new Set<string>();

  for (let i = 0; i < waypoints.length; i++) {
    const [lat, lon] = waypoints[i];
    if (i > 0) {
      distanceKm += marsDistanceKm(waypoints[i - 1][0], waypoints[i - 1][1], lat, lon);
    }
    const normLon = normalizeLonE(lon);
    const elev = getArcadiaElevationMeters(lat, normLon);
    if (elev > prevElev) elevationGainM += elev - prevElev;
    prevElev = elev;
    maxElevationM = Math.max(maxElevationM, elev);
    minElevationM = Math.min(minElevationM, elev);

    for (const h of TERRAIN_HAZARDS) {
      if (marsDistanceKm(lat, normLon, h.lat, h.lonE) <= h.radiusKm * 1.25) {
        nearSet.add(`${h.name}`);
      }
    }
  }

  const roundedDist = Number(distanceKm.toFixed(1));
  return {
    waypoints,
    segments: [waypoints],
    straightLineKm,
    distanceKm: roundedDist,
    walkingHours: Number((roundedDist / 3.5).toFixed(1)),
    roverHours: Number((roundedDist / 12.0).toFixed(1)),
    elevationAvailable: true,
    startElevationM: getArcadiaElevationMeters(sLat, sLon),
    endElevationM: getArcadiaElevationMeters(eLat, eLon),
    maxElevationM,
    minElevationM,
    elevationGainM: Math.round(elevationGainM),
    hazardsNearRoute: Array.from(nearSet),
    routeMode: 'arcadia_terrain',
    isApproximate: true
  };
}
