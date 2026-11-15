import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CloudLightning,
  Compass,
  ExternalLink,
  Flag,
  Globe,
  Info,
  Layers,
  Loader2,
  MapPin,
  Navigation,
  RefreshCw,
  RotateCcw,
  Route as RouteIcon,
  Thermometer,
  Trash2,
  Wind,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import {
  ARCADIA_STUDY_BOUNDS,
  CTX_COVERAGE_STRIPS,
  HIRISE_FOOTPRINTS,
  INVESTIGATION_STOPS,
  PROPOSED_HABITAT,
  SUBSURFACE_ICE_ZONES,
  TERRAIN_HAZARDS,
  computeTerrainAwareRoute,
  formatMarsCoords,
  getArcadiaElevationMeters,
  getArcadiaSlopeDegrees,
  isInsideArcadiaStudy,
  marsDistanceKm,
  normalizeLonE,
  HiRISEFootprint,
  InvestigationStop,
  SubsurfaceIceZone,
  TerrainHazard
} from '../data/arcadiaData';
import { MARS_LOCATIONS, MarsLocation, findMatchingMarsLocation } from '../data/marsLocations';
import { MEASURED_MARS_STATIONS, MeasuredStationRecord } from '../data/marsWeatherStations';
import {
  McdStormFile,
  McdTemperatureFile,
  STORM_LEGEND_BANDS,
  STORM_SCENARIO_LIST,
  StormQueryResult,
  StormScenarioId,
  TEMPERATURE_LEGEND_BANDS,
  TEMP_SCENARIO_LIST,
  TemperatureQueryResult,
  TempScenarioId,
  drawClimateTile,
  loadStormDataset,
  loadTemperatureDataset,
  queryStormAtPoint,
  queryTemperatureAtPoint
} from '../data/marsClimateData';

type MapMode = 'navigator' | 'temperature' | 'storm';
type NavigatorClickMode = 'inspect' | 'set_astronaut' | 'set_destination';

type SelectedNavigatorFeature =
  | { kind: 'location'; data: MarsLocation }
  | { kind: 'ice'; data: SubsurfaceIceZone }
  | { kind: 'hazard'; data: TerrainHazard }
  | { kind: 'stop'; data: InvestigationStop }
  | { kind: 'hirise'; data: HiRISEFootprint }
  | { kind: 'habitat' }
  | {
      kind: 'point';
      lat: number;
      lon: number;
      insideArcadia: boolean;
      elevationM: number | null;
      slopeDeg: number | null;
      hiriseCovered: HiRISEFootprint | null;
      inCtx: boolean;
      inIceZone: SubsurfaceIceZone | null;
    };

// Custom Equirectangular Mars Projection spanning full 0°E–360°E planetary bounds
// (Default L.Projection.LonLat clamps world tile bounds at +180°E, dropping the entire 180°E–360°E half.)
const MarsProjection: L.Projection = L.extend({}, L.Projection.LonLat, {
  bounds: L.bounds([0, -90], [360, 90])
});

// Custom Equirectangular Mars CRS with true Martian great-circle distance (R = 3,389.5 km)
const MarsEquirectangularCRS: L.CRS = L.extend({}, L.CRS.Simple, {
  projection: MarsProjection,
  transformation: new L.Transformation(1 / 180, 0, -1 / 180, 0.5),
  scale(zoom: number) {
    return 256 * Math.pow(2, zoom);
  },
  zoom(scale: number) {
    return Math.log(scale / 256) / Math.LN2;
  },
  distance(latlng1: L.LatLng, latlng2: L.LatLng) {
    return marsDistanceKm(latlng1.lat, latlng1.lng, latlng2.lat, latlng2.lng) * 1000;
  },
  infinite: false
});

function getGlobalMarsZoom(map: L.Map | null): number {
  const width =
    map?.getSize().x ||
    (typeof window !== 'undefined' ? Math.max(320, Math.min(900, window.innerWidth - 32)) : 880);
  const raw = Math.log2(Math.max(0.75, width / 512));
  const snapped = Math.floor(raw * 4) / 4;
  return Math.max(0.25, Math.min(1.5, snapped));
}

function createMarsTrekLayer(layerId: string, opacity = 1.0, zIndex = 2): L.TileLayer {
  const TrekLayer = L.TileLayer.extend({
    getTileUrl(coords: L.Coords) {
      const z = coords.z;
      const matrixW = Math.pow(2, z + 1);
      const matrixH = Math.pow(2, z);
      if (coords.y < 0 || coords.y >= matrixH) {
        return '';
      }
      const rawCol = coords.x - Math.pow(2, z);
      const col = ((rawCol % matrixW) + matrixW) % matrixW;
      return `https://trek.nasa.gov/tiles/Mars/EQ/${layerId}/1.0.0/default/default028mm/${z}/${coords.y}/${col}.jpg`;
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (TrekLayer as any)('', {
    tileSize: 256,
    minZoom: 0,
    maxZoom: 10,
    maxNativeZoom: 7,
    keepBuffer: 4,
    updateWhenIdle: false,
    noWrap: true,
    opacity,
    zIndex,
    crossOrigin: 'anonymous',
    attribution: 'NASA Mars Trek / JPL / USGS'
  });
}

function createClimateTileLayer(
  mode: 'temperature' | 'storm',
  scenarioId: string,
  tempDataset: McdTemperatureFile | null,
  stormDataset: McdStormFile | null
): L.GridLayer {
  const ClimateLayer = L.GridLayer.extend({
    createTile(coords: L.Coords) {
      const tile = document.createElement('canvas');
      tile.width = 256;
      tile.height = 256;
      drawClimateTile(tile, coords, mode, scenarioId, tempDataset, stormDataset);
      return tile;
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (ClimateLayer as any)({
    tileSize: 256,
    minZoom: 0,
    maxZoom: 10,
    keepBuffer: 4,
    updateWhenIdle: false,
    noWrap: true,
    pane: 'climatePane',
    zIndex: 10
  });
}

const DEFAULT_ASTRONAUT_POS: [number, number] = [PROPOSED_HABITAT.lat, PROPOSED_HABITAT.lonE];
const DEFAULT_DEST_POS: [number, number] = [INVESTIGATION_STOPS[1].lat, INVESTIGATION_STOPS[1].lonE];
const DEFAULT_TEMP_POINT: [number, number] = [46.7, 188.0]; // Arcadia Planitia (shared DB)
const DEFAULT_STORM_POINT: [number, number] = [-5.4, 137.8]; // Gale Crater (shared DB)

const PHOENIX_STATION = MEASURED_MARS_STATIONS.find((s) => s.id === 'phoenix-vastitas') ?? null;

export default function ExpeditionMap2D() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const [mapMode, setMapMode] = useState<MapMode>('navigator');
  const mapModeRef = useRef<MapMode>(mapMode);
  mapModeRef.current = mapMode;
  const prevMapModeRef = useRef<MapMode>('navigator');

  // Basemap live tile status + fallback indicator
  const [basemapLoading, setBasemapLoading] = useState(true);
  const [basemapFallbackActive, setBasemapFallbackActive] = useState(false);

  // -------------------------------------------------------------------------
  // MODE 1: NAVIGATOR STATE
  // -------------------------------------------------------------------------
  const [clickMode, setClickMode] = useState<NavigatorClickMode>('inspect');
  const clickModeRef = useRef<NavigatorClickMode>(clickMode);
  clickModeRef.current = clickMode;

  const [astronautPos, setAstronautPos] = useState<[number, number] | null>(DEFAULT_ASTRONAUT_POS);
  const [destinationPos, setDestinationPos] = useState<[number, number] | null>(DEFAULT_DEST_POS);
  const [isDefaultExample, setIsDefaultExample] = useState(true);

  const [showArcadiaLayers, setShowArcadiaLayers] = useState(true);
  const [showElevationRelief, setShowElevationRelief] = useState(false);
  const [layersDrawerOpen, setLayersDrawerOpen] = useState(false);
  const [selectedNavFeature, setSelectedNavFeature] = useState<SelectedNavigatorFeature | null>(
    null
  );

  // -------------------------------------------------------------------------
  // MODE 2: TEMPERATURE MAP STATE + ASYNC LOADING
  // -------------------------------------------------------------------------
  const [tempScenario, setTempScenario] = useState<TempScenarioId>('ls90_day');
  const [tempPoint, setTempPoint] = useState<[number, number]>(DEFAULT_TEMP_POINT);
  const [selectedTempLocation, setSelectedTempLocation] = useState<MarsLocation | null>(
    () => MARS_LOCATIONS.find((l) => l.id === 'arcadia-planitia') ?? null
  );
  const [selectedTempStation, setSelectedTempStation] = useState<MeasuredStationRecord | null>(
    null
  );
  const [tempDataset, setTempDataset] = useState<McdTemperatureFile | null>(null);
  const [tempLoadStatus, setTempLoadStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    'idle'
  );
  const [tempLoadMessage, setTempLoadMessage] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // MODE 3: STORM & WIND MAP STATE + ASYNC LOADING
  // -------------------------------------------------------------------------
  const [stormScenario, setStormScenario] = useState<StormScenarioId>('my34_storm');
  const [stormPoint, setStormPoint] = useState<[number, number]>(DEFAULT_STORM_POINT);
  const [selectedStormLocation, setSelectedStormLocation] = useState<MarsLocation | null>(
    () => MARS_LOCATIONS.find((l) => l.id === 'gale-crater') ?? null
  );
  const [selectedStormStation, setSelectedStormStation] = useState<MeasuredStationRecord | null>(
    () => MEASURED_MARS_STATIONS.find((s) => s.id === 'curiosity-gale') ?? null
  );
  const [stormDataset, setStormDataset] = useState<McdStormFile | null>(null);
  const [stormLoadStatus, setStormLoadStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    'idle'
  );
  const [stormLoadMessage, setStormLoadMessage] = useState<string | null>(null);

  // Live cursor readout
  const [cursorInfo, setCursorInfo] = useState<{
    lat: number;
    lon: number;
    insideArcadia: boolean;
    elevM: number | null;
  }>({
    lat: ARCADIA_STUDY_BOUNDS.centerLat,
    lon: ARCADIA_STUDY_BOUNDS.centerLonE,
    insideArcadia: true,
    elevM: getArcadiaElevationMeters(ARCADIA_STUDY_BOUNDS.centerLat, ARCADIA_STUDY_BOUNDS.centerLonE)
  });

  const layerRefs = useRef<{
    elevationTiles?: L.TileLayer;
    navigatorStaticGroup?: L.LayerGroup;
    navigatorRouteGroup?: L.LayerGroup;
    sharedLocationsGroup?: L.LayerGroup;
    climateGridLayer?: L.GridLayer;
    phoenixMarkerGroup?: L.LayerGroup;
    inspectPinGroup?: L.LayerGroup;
  }>({});

  // =========================================================================
  // ASYNC CLIMATE DATASET RETRIEVAL WITH CACHE + AUTOMATIC BACKUP FALLBACK
  // =========================================================================
  const fetchTempData = useCallback(async (force = false) => {
    setTempLoadStatus('loading');
    setTempLoadMessage('Retrieving Mars Climate Database temperature grid...');
    try {
      const res = await loadTemperatureDataset(force);
      setTempDataset(res.data);
      setTempLoadStatus('ready');
      setTempLoadMessage(res.warning ?? null);
    } catch (err) {
      setTempDataset(null);
      setTempLoadStatus('error');
      setTempLoadMessage(
        err instanceof Error
          ? err.message
          : 'Unable to retrieve Martian temperature dataset. Please try again.'
      );
    }
  }, []);

  const fetchStormData = useCallback(async (force = false) => {
    setStormLoadStatus('loading');
    setStormLoadMessage('Retrieving Martian wind & dust-storm dataset...');
    try {
      const res = await loadStormDataset(force);
      setStormDataset(res.data);
      setStormLoadStatus('ready');
      setStormLoadMessage(res.warning ?? null);
    } catch (err) {
      setStormDataset(null);
      setStormLoadStatus('error');
      setStormLoadMessage(
        err instanceof Error
          ? err.message
          : 'Unable to retrieve Martian storm dataset. Please try again.'
      );
    }
  }, []);

  // Preload both datasets asynchronously on mount & when switching to Temperature / Storm
  useEffect(() => {
    void fetchTempData(false);
    void fetchStormData(false);
  }, [fetchTempData, fetchStormData]);

  // Computed Route & Queries
  const routeResult = useMemo(() => {
    if (!astronautPos || !destinationPos) return null;
    return computeTerrainAwareRoute(
      astronautPos[0],
      astronautPos[1],
      destinationPos[0],
      destinationPos[1]
    );
  }, [astronautPos, destinationPos]);

  const tempQuery: TemperatureQueryResult = useMemo(
    () => queryTemperatureAtPoint(tempPoint[0], tempPoint[1], tempScenario, tempDataset),
    [tempPoint, tempScenario, tempDataset]
  );

  const stormQuery: StormQueryResult = useMemo(
    () => queryStormAtPoint(stormPoint[0], stormPoint[1], stormScenario, stormDataset),
    [stormPoint, stormScenario, stormDataset]
  );

  // =========================================================================
  // INITIALIZE SINGLE LEAFLET MAP WITH STRICT PANE STACKING ORDER
  // =========================================================================
  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el || mapRef.current) return;

    const map = L.map(el, {
      crs: MarsEquirectangularCRS,
      center: [43.2, 182.0],
      zoom: 5,
      minZoom: 0,
      maxZoom: 10,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      zoomControl: false,
      maxBounds: [
        [-88, 0],
        [88, 360]
      ],
      maxBoundsViscosity: 0.9
    });
    mapRef.current = map;

    // Dedicated panes guarantee basemap fallback NEVER covers tiles or climate heatmaps!
    const fallbackPane = map.createPane('basemapFallbackPane');
    fallbackPane.style.zIndex = '150'; // Below tilePane (200)

    const climatePane = map.createPane('climatePane');
    climatePane.style.zIndex = '350'; // Above tilePane (200), below overlayPane (400) & markers (600)
    climatePane.style.pointerEvents = 'none';

    L.control
      .scale({ position: 'bottomleft', imperial: false, metric: true, maxWidth: 160 })
      .addTo(map);

    // Local 2K Viking mosaic rendered BELOW live tiles so map is never blank during load or outage
    L.imageOverlay('/assets/mars/mars_viking_2k.jpg', [[-90, -180], [90, 180]], {
      opacity: 1,
      pane: 'basemapFallbackPane'
    }).addTo(map);
    L.imageOverlay('/assets/mars/mars_viking_2k.jpg', [[-90, 180], [90, 540]], {
      opacity: 1,
      pane: 'basemapFallbackPane'
    }).addTo(map);

    // Live multi-zoom NASA Mars Trek Viking Mosaic (z=2..7, ~232 m/px) in tilePane (zIndex 200)
    const vikingTiles = createMarsTrekLayer('Mars_Viking_MDIM21_ClrMosaic_global_232m', 1.0, 2);
    let tileFailCount = 0;
    let tileSuccessCount = 0;

    vikingTiles.on('loading', () => {
      setBasemapLoading(true);
    });
    vikingTiles.on('tileload', () => {
      tileSuccessCount++;
      setBasemapFallbackActive(false);
    });
    vikingTiles.on('tileerror', () => {
      tileFailCount++;
      if (tileSuccessCount === 0 && tileFailCount >= 2) {
        setBasemapFallbackActive(true);
      }
    });
    vikingTiles.on('load', () => {
      setBasemapLoading(false);
    });
    vikingTiles.addTo(map);

    // Optional MOLA Color Shaded Elevation overlay (Navigator only)
    const elevationTiles = createMarsTrekLayer(
      'Mars_MGS_MOLA_ClrShade_merge_global_463m',
      0.45,
      5
    );

    // Arcadia Planitia Study Layers (Navigator mode only)
    const navigatorStaticGroup = L.layerGroup().addTo(map);

    L.rectangle(
      [
        [ARCADIA_STUDY_BOUNDS.minLat, ARCADIA_STUDY_BOUNDS.minLonE],
        [ARCADIA_STUDY_BOUNDS.maxLat, ARCADIA_STUDY_BOUNDS.maxLonE]
      ],
      {
        color: '#CBD5E1',
        weight: 1.5,
        dashArray: '6 4',
        fill: false,
        interactive: false
      }
    ).addTo(navigatorStaticGroup);

    for (const strip of CTX_COVERAGE_STRIPS) {
      L.rectangle(strip.bounds, {
        color: '#94A3B8',
        weight: 1,
        dashArray: '4 4',
        fillColor: '#CBD5E1',
        fillOpacity: 0.04,
        interactive: false
      }).addTo(navigatorStaticGroup);
    }

    for (const fp of HIRISE_FOOTPRINTS) {
      const rect = L.rectangle(fp.bounds, {
        color: '#38BDF8',
        weight: 1.5,
        fillColor: '#38BDF8',
        fillOpacity: 0.08
      });
      rect.on('click', (ev) => {
        if (mapModeRef.current !== 'navigator') return;
        if (clickModeRef.current !== 'inspect') {
          dispatchMapClick(ev.latlng.lat, ev.latlng.lng);
          return;
        }
        L.DomEvent.stopPropagation(ev);
        setSelectedNavFeature({ kind: 'hirise', data: fp });
      });
      rect.bindTooltip(`HiRISE ${fp.obsId} (~0.3 m/px)`, { sticky: true });
      rect.addTo(navigatorStaticGroup);
    }

    for (const zone of SUBSURFACE_ICE_ZONES) {
      const poly = L.polygon(zone.polygon, {
        color: '#3B82F6',
        weight: 1.5,
        fillColor: '#3B82F6',
        fillOpacity: 0.2
      });
      poly.on('click', (ev) => {
        if (mapModeRef.current !== 'navigator') return;
        if (clickModeRef.current !== 'inspect') {
          dispatchMapClick(ev.latlng.lat, ev.latlng.lng);
          return;
        }
        L.DomEvent.stopPropagation(ev);
        setSelectedNavFeature({ kind: 'ice', data: zone });
      });
      poly.bindTooltip(`${zone.name} (Potential Subsurface Ice)`, { sticky: true });
      poly.addTo(navigatorStaticGroup);
    }

    // Hazards / Terrain Requiring Inspection (Distinct Orange Circle)
    for (const haz of TERRAIN_HAZARDS) {
      const degRadius = haz.radiusKm / 59.16;
      const circle = L.circle([haz.lat, haz.lonE], {
        radius: degRadius,
        color: '#F97316',
        weight: 1.5,
        dashArray: haz.category === 'boulder_field' ? '5 4' : undefined,
        fillColor: '#F97316',
        fillOpacity: 0.18
      });
      circle.on('click', (ev) => {
        if (mapModeRef.current !== 'navigator') return;
        if (clickModeRef.current !== 'inspect') {
          dispatchMapClick(ev.latlng.lat, ev.latlng.lng);
          return;
        }
        L.DomEvent.stopPropagation(ev);
        setSelectedNavFeature({ kind: 'hazard', data: haz });
      });
      circle.bindTooltip(`${haz.name} (Terrain Hazard / Inspection)`, { sticky: true });
      circle.addTo(navigatorStaticGroup);
    }

    // Investigation Areas (Yellow Stops A–D)
    for (const stop of INVESTIGATION_STOPS) {
      const icon = L.divIcon({
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        html: `<div style="width:22px;height:22px;border-radius:9999px;background:#EAB308;border:2px solid #07090E;color:#07090E;font-weight:700;font-size:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.6)">${stop.code.replace('Stop ', '')}</div>`
      });
      const marker = L.marker([stop.lat, stop.lonE], { icon, zIndexOffset: 430 });
      marker.on('click', (ev) => {
        if (mapModeRef.current !== 'navigator') return;
        if (clickModeRef.current !== 'inspect') {
          dispatchMapClick(stop.lat, stop.lonE);
          return;
        }
        L.DomEvent.stopPropagation(ev);
        setSelectedNavFeature({ kind: 'stop', data: stop });
      });
      marker.bindTooltip(`${stop.code}: ${stop.name}`, { direction: 'top' });
      marker.addTo(navigatorStaticGroup);
    }

    // Proposed Habitat / Base (Purple Square)
    const habitatIcon = L.divIcon({
      className: '',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      html: `<div style="width:28px;height:28px;border-radius:6px;background:#9333EA;border:2px solid #F3E8FF;color:#FFFFFF;font-weight:700;font-size:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(147,51,234,0.6)">HAB</div>`
    });
    const habMarker = L.marker([PROPOSED_HABITAT.lat, PROPOSED_HABITAT.lonE], {
      icon: habitatIcon,
      zIndexOffset: 460
    });
    habMarker.on('click', (ev) => {
      if (mapModeRef.current !== 'navigator') return;
      if (clickModeRef.current !== 'inspect') {
        dispatchMapClick(PROPOSED_HABITAT.lat, PROPOSED_HABITAT.lonE);
        return;
      }
      L.DomEvent.stopPropagation(ev);
      setSelectedNavFeature({ kind: 'habitat' });
    });
    habMarker.bindTooltip(`${PROPOSED_HABITAT.name} (Purple — Proposed Base)`, { direction: 'top' });
    habMarker.addTo(navigatorStaticGroup);

    // SHARED 3D / 2D IMPORTANT MARS LOCATIONS LAYER — ALWAYS VISIBLE ON ALL 3 MAPS
    const sharedLocationsGroup = L.layerGroup().addTo(map);
    for (const loc of MARS_LOCATIONS) {
      const isLandmark = loc.markerCategory === 'landmark';
      const label = loc.shortLabel ?? loc.name;
      // Distinct styling: Amber diamond for geological landmarks; Sky-blue circle for exploration sites
      const pinShape = isLandmark
        ? `<div style="width:14px;height:14px;transform:rotate(45deg);background:#F59E0B;border:2px solid #FFFFFF;box-shadow:0 2px 6px rgba(0,0,0,0.85);flex-shrink:0"></div>`
        : `<div style="width:14px;height:14px;border-radius:9999px;background:#0EA5E9;border:2px solid #FFFFFF;box-shadow:0 2px 6px rgba(0,0,0,0.85);flex-shrink:0"></div>`;

      // Offset Elysium slightly upward and Gale slightly downward so nearby labels stay readable at low zoom
      const labelOffsetY =
        loc.id === 'elysium-planitia' ? '-14px' : loc.id === 'gale-crater' ? '8px' : '0px';

      const icon = L.divIcon({
        className: '',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        html: `<div style="position:relative;display:flex;align-items:center;pointer-events:auto;cursor:pointer">
          ${pinShape}
          <span style="position:absolute;left:18px;top:50%;transform:translateY(calc(-50% + ${labelOffsetY}));white-space:nowrap;padding:1px 6px;border-radius:4px;background:rgba(7,9,14,0.84);border:1px solid ${
            isLandmark ? 'rgba(245,158,11,0.55)' : 'rgba(56,189,248,0.55)'
          };color:#F8FAFC;font-size:10px;font-weight:600;line-height:14px;box-shadow:0 1px 4px rgba(0,0,0,0.75);pointer-events:auto">${label}</span>
        </div>`
      });

      const marker = L.marker([loc.lat, loc.lonEast360], {
        icon,
        zIndexOffset: 520
      });

      marker.on('click', (ev) => {
        L.DomEvent.stopPropagation(ev);
        const tab = mapModeRef.current;

        if (tab === 'navigator') {
          const mode = clickModeRef.current;
          if (mode === 'set_astronaut') {
            setAstronautPos([loc.lat, loc.lonEast360]);
            setIsDefaultExample(false);
            setClickMode('inspect');
            setSelectedNavFeature({ kind: 'location', data: loc });
            return;
          }
          if (mode === 'set_destination') {
            setDestinationPos([loc.lat, loc.lonEast360]);
            setIsDefaultExample(false);
            setClickMode('inspect');
            setSelectedNavFeature({ kind: 'location', data: loc });
            return;
          }
          setSelectedNavFeature({ kind: 'location', data: loc });
          return;
        }

        const linkedStation = loc.stationId
          ? MEASURED_MARS_STATIONS.find((s) => s.id === loc.stationId) ?? null
          : null;

        if (tab === 'temperature') {
          setTempPoint([loc.lat, loc.lonEast360]);
          setSelectedTempLocation(loc);
          setSelectedTempStation(linkedStation);
        } else if (tab === 'storm') {
          setStormPoint([loc.lat, loc.lonEast360]);
          setSelectedStormLocation(loc);
          setSelectedStormStation(linkedStation);
        }
      });

      marker.bindTooltip(
        `${loc.name} (${formatMarsCoords(loc.lat, loc.lonEast360)}) — Click for details`,
        { direction: 'top' }
      );
      marker.addTo(sharedLocationsGroup);
    }

    // Extra meteorological station marker (Phoenix — Arctic North, not in 3D MARS_LOCATIONS)
    const phoenixMarkerGroup = L.layerGroup();
    if (PHOENIX_STATION) {
      const pIcon = L.divIcon({
        className: '',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        html: `<div style="width:18px;height:18px;border-radius:9999px;background:#0F172A;border:2px solid #34D399;color:#34D399;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.8)">★</div>`
      });
      const pMarker = L.marker([PHOENIX_STATION.lat, PHOENIX_STATION.lonE], {
        icon: pIcon,
        zIndexOffset: 560
      });
      pMarker.bindTooltip(`${PHOENIX_STATION.name} — NASA In-Situ Weather Station`, {
        direction: 'top'
      });
      pMarker.on('click', (ev) => {
        L.DomEvent.stopPropagation(ev);
        if (mapModeRef.current === 'temperature') {
          setTempPoint([PHOENIX_STATION.lat, PHOENIX_STATION.lonE]);
          setSelectedTempLocation(null);
          setSelectedTempStation(PHOENIX_STATION);
        } else if (mapModeRef.current === 'storm') {
          setStormPoint([PHOENIX_STATION.lat, PHOENIX_STATION.lonE]);
          setSelectedStormLocation(null);
          setSelectedStormStation(PHOENIX_STATION);
        }
      });
      pMarker.addTo(phoenixMarkerGroup);
    }

    const navigatorRouteGroup = L.layerGroup().addTo(map);
    const inspectPinGroup = L.layerGroup();

    layerRefs.current = {
      elevationTiles,
      navigatorStaticGroup,
      navigatorRouteGroup,
      sharedLocationsGroup,
      phoenixMarkerGroup,
      inspectPinGroup
    };

    function dispatchMapClick(lat: number, lon: number) {
      const clampedLat = Math.max(-88, Math.min(88, lat));
      const normLon = normalizeLonE(lon);
      const currentTab = mapModeRef.current;

      if (currentTab === 'temperature') {
        const matched = findMatchingMarsLocation(clampedLat, normLon, 4.0);
        setTempPoint([clampedLat, normLon]);
        setSelectedTempLocation(matched);
        setSelectedTempStation(
          matched?.stationId
            ? MEASURED_MARS_STATIONS.find((s) => s.id === matched.stationId) ?? null
            : null
        );
        return;
      }

      if (currentTab === 'storm') {
        const matched = findMatchingMarsLocation(clampedLat, normLon, 4.0);
        setStormPoint([clampedLat, normLon]);
        setSelectedStormLocation(matched);
        setSelectedStormStation(
          matched?.stationId
            ? MEASURED_MARS_STATIONS.find((s) => s.id === matched.stationId) ?? null
            : null
        );
        return;
      }

      // Navigator mode:
      const navLat = Math.max(-85, Math.min(85, lat));
      const mode = clickModeRef.current;

      if (mode === 'set_astronaut') {
        setAstronautPos([navLat, normLon]);
        setIsDefaultExample(false);
        setClickMode('inspect');
        return;
      }

      if (mode === 'set_destination') {
        setDestinationPos([navLat, normLon]);
        setIsDefaultExample(false);
        setClickMode('inspect');
        return;
      }

      const insideArcadia = isInsideArcadiaStudy(navLat, normLon);
      const hiriseCovered =
        HIRISE_FOOTPRINTS.find(
          (f) =>
            navLat >= f.bounds[0][0] &&
            navLat <= f.bounds[1][0] &&
            normLon >= f.bounds[0][1] &&
            normLon <= f.bounds[1][1]
        ) ?? null;

      const inCtx = CTX_COVERAGE_STRIPS.some(
        (s) =>
          navLat >= s.bounds[0][0] &&
          navLat <= s.bounds[1][0] &&
          normLon >= s.bounds[0][1] &&
          normLon <= s.bounds[1][1]
      );

      const inIceZone =
        SUBSURFACE_ICE_ZONES.find((z) => {
          const lats = z.polygon.map((p) => p[0]);
          const lons = z.polygon.map((p) => p[1]);
          return (
            navLat >= Math.min(...lats) &&
            navLat <= Math.max(...lats) &&
            normLon >= Math.min(...lons) &&
            normLon <= Math.max(...lons)
          );
        }) ?? null;

      setSelectedNavFeature({
        kind: 'point',
        lat: navLat,
        lon: normLon,
        insideArcadia,
        elevationM: insideArcadia ? getArcadiaElevationMeters(navLat, normLon) : null,
        slopeDeg: insideArcadia ? getArcadiaSlopeDegrees(navLat, normLon) : null,
        hiriseCovered,
        inCtx,
        inIceZone
      });
    }

    map.on('click', (e: L.LeafletMouseEvent) => {
      dispatchMapClick(e.latlng.lat, e.latlng.lng);
    });

    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      const lat = Math.max(-88, Math.min(88, e.latlng.lat));
      const normLon = normalizeLonE(e.latlng.lng);
      const inside = isInsideArcadiaStudy(lat, normLon);
      setCursorInfo({
        lat,
        lon: normLon,
        insideArcadia: inside,
        elevM: inside ? getArcadiaElevationMeters(lat, normLon) : null
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // =========================================================================
  // SYNCHRONIZE ACTIVE LAYERS + CLIMATE GRID LAYER (TILED & CACHED)
  // =========================================================================
  useEffect(() => {
    const map = mapRef.current;
    const refs = layerRefs.current;
    if (!map) return;

    const sync = (layer: L.Layer | undefined, visible: boolean) => {
      if (!layer) return;
      if (visible && !map.hasLayer(layer)) map.addLayer(layer);
      if (!visible && map.hasLayer(layer)) map.removeLayer(layer);
    };

    const isNav = mapMode === 'navigator';
    const isTemp = mapMode === 'temperature';
    const isStorm = mapMode === 'storm';

    sync(refs.navigatorStaticGroup, isNav && showArcadiaLayers);
    sync(refs.elevationTiles, isNav && showElevationRelief);
    sync(refs.navigatorRouteGroup, isNav);
    sync(refs.sharedLocationsGroup, true); // ALWAYS visible on all 3 maps!
    sync(refs.phoenixMarkerGroup, isTemp || isStorm);
    sync(refs.inspectPinGroup, isTemp || isStorm);

    // Replace active climate canvas GridLayer cleanly whenever mode, scenario, or dataset updates
    if (refs.climateGridLayer) {
      map.removeLayer(refs.climateGridLayer);
      refs.climateGridLayer = undefined;
    }

    if (isTemp && tempDataset) {
      const layer = createClimateTileLayer('temperature', tempScenario, tempDataset, null);
      layer.addTo(map);
      refs.climateGridLayer = layer;
    } else if (isStorm && stormDataset) {
      const layer = createClimateTileLayer('storm', stormScenario, null, stormDataset);
      layer.addTo(map);
      refs.climateGridLayer = layer;
    }

    map.invalidateSize({ animate: false });

    // Cleanly recenter view when switching between Navigator and Global Climate maps
    if (prevMapModeRef.current !== mapMode) {
      const wasNav = prevMapModeRef.current === 'navigator';
      prevMapModeRef.current = mapMode;
      if (isNav) {
        map.setView([43.2, 182.0], 5, { animate: false });
      } else if (wasNav) {
        map.setView([0, 180.0], getGlobalMarsZoom(map), { animate: false });
      }
    }
  }, [
    mapMode,
    showArcadiaLayers,
    showElevationRelief,
    tempScenario,
    stormScenario,
    tempDataset,
    stormDataset
  ]);

  // Render Inspection Pin on Temperature & Storm Maps
  useEffect(() => {
    const group = layerRefs.current.inspectPinGroup;
    if (!group) return;
    group.clearLayers();

    if (mapMode === 'temperature') {
      const color = tempQuery.band?.hex ?? '#94A3B8';
      const icon = L.divIcon({
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        html: `<div style="width:22px;height:22px;border-radius:9999px;background:${color};border:3px solid #FFFFFF;box-shadow:0 2px 10px rgba(0,0,0,0.9)"></div>`
      });
      L.marker(tempPoint, { icon, zIndexOffset: 790, interactive: false }).addTo(group);
    } else if (mapMode === 'storm') {
      const color = stormQuery.band?.hex ?? '#94A3B8';
      const icon = L.divIcon({
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        html: `<div style="width:22px;height:22px;border-radius:9999px;background:${color};border:3px solid #FFFFFF;box-shadow:0 2px 10px rgba(0,0,0,0.9)"></div>`
      });
      L.marker(stormPoint, { icon, zIndexOffset: 790, interactive: false }).addTo(group);
    }
  }, [mapMode, tempPoint, stormPoint, tempQuery.band?.hex, stormQuery.band?.hex]);

  // Render Green Astronaut Dot, Red Destination Dot & Route (Navigator Mode)
  useEffect(() => {
    const group = layerRefs.current.navigatorRouteGroup;
    if (!group) return;
    group.clearLayers();

    if (routeResult && routeResult.segments.length >= 1) {
      L.polyline(routeResult.segments, {
        color: '#16A34A',
        weight: 6,
        opacity: 0.45
      }).addTo(group);

      L.polyline(routeResult.segments, {
        color: '#22C55E',
        weight: 3.5,
        opacity: 0.96,
        dashArray: routeResult.routeMode === 'global_approximate' ? '8 6' : undefined
      }).addTo(group);
    }

    if (astronautPos) {
      const greenIcon = L.divIcon({
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        html: `<div style="width:28px;height:28px;border-radius:9999px;background:#22C55E;border:3px solid #FFFFFF;color:#052E16;font-weight:800;font-size:11px;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(0,0,0,0.75);cursor:grab">A</div>`
      });
      const astroMarker = L.marker(astronautPos, {
        icon: greenIcon,
        draggable: true,
        zIndexOffset: 850
      });
      astroMarker.bindTooltip(
        `Green: Astronaut Starting Point (${formatMarsCoords(astronautPos[0], astronautPos[1])}) — Drag to move`,
        { direction: 'top' }
      );
      astroMarker.on('dragend', (ev) => {
        const ll = (ev.target as L.Marker).getLatLng();
        setAstronautPos([Math.max(-85, Math.min(85, ll.lat)), normalizeLonE(ll.lng)]);
        setIsDefaultExample(false);
      });
      astroMarker.addTo(group);
    }

    if (destinationPos) {
      const redIcon = L.divIcon({
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        html: `<div style="width:28px;height:28px;border-radius:9999px;background:#EF4444;border:3px solid #FFFFFF;color:#FFFFFF;font-weight:800;font-size:11px;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(0,0,0,0.75);cursor:grab">B</div>`
      });
      const destMarker = L.marker(destinationPos, {
        icon: redIcon,
        draggable: true,
        zIndexOffset: 850
      });
      destMarker.bindTooltip(
        `Red: Destination (${formatMarsCoords(destinationPos[0], destinationPos[1])}) — Drag to move`,
        { direction: 'top' }
      );
      destMarker.on('dragend', (ev) => {
        const ll = (ev.target as L.Marker).getLatLng();
        setDestinationPos([Math.max(-85, Math.min(85, ll.lat)), normalizeLonE(ll.lng)]);
        setIsDefaultExample(false);
      });
      destMarker.addTo(group);
    }
  }, [astronautPos, destinationPos, routeResult]);

  // =========================================================================
  // UI ACTIONS & HANDLERS
  // =========================================================================
  const handleSwitchMapMode = (next: MapMode) => {
    setMapMode(next);
    setClickMode('inspect');
    if (next === 'temperature' && tempLoadStatus === 'error') {
      void fetchTempData(true);
    }
    if (next === 'storm' && stormLoadStatus === 'error') {
      void fetchStormData(true);
    }
  };

  const handleResetActiveMap = () => {
    const map = mapRef.current;
    if (mapMode === 'navigator') {
      setClickMode('inspect');
      setAstronautPos(DEFAULT_ASTRONAUT_POS);
      setDestinationPos(DEFAULT_DEST_POS);
      setIsDefaultExample(true);
      setShowArcadiaLayers(true);
      setShowElevationRelief(false);
      setSelectedNavFeature(null);
      map?.setView([43.2, 182.0], 5, { animate: true });
    } else if (mapMode === 'temperature') {
      setTempScenario('ls90_day');
      setTempPoint(DEFAULT_TEMP_POINT);
      setSelectedTempLocation(MARS_LOCATIONS.find((l) => l.id === 'arcadia-planitia') ?? null);
      setSelectedTempStation(null);
      map?.setView([0, 180.0], getGlobalMarsZoom(map), { animate: true });
    } else {
      setStormScenario('my34_storm');
      setStormPoint(DEFAULT_STORM_POINT);
      setSelectedStormLocation(MARS_LOCATIONS.find((l) => l.id === 'gale-crater') ?? null);
      setSelectedStormStation(
        MEASURED_MARS_STATIONS.find((s) => s.id === 'curiosity-gale') ?? null
      );
      map?.setView([0, 180.0], getGlobalMarsZoom(map), { animate: true });
    }
  };

  const handleClearMarkers = () => {
    setAstronautPos(null);
    setDestinationPos(null);
    setIsDefaultExample(false);
    setClickMode('set_astronaut');
  };

  const handleSelectLandmarkAsPoint = (role: 'start' | 'dest', locId: string) => {
    const loc = MARS_LOCATIONS.find((l) => l.id === locId);
    if (!loc) return;
    if (role === 'start') {
      setAstronautPos([loc.lat, loc.lonEast360]);
    } else {
      setDestinationPos([loc.lat, loc.lonEast360]);
    }
    setIsDefaultExample(false);
    setClickMode('inspect');
    setSelectedNavFeature({ kind: 'location', data: loc });

    // Frame route nicely if both markers exist, otherwise center on chosen landmark
    const map = mapRef.current;
    if (map) {
      const other = role === 'start' ? destinationPos : astronautPos;
      if (other) {
        const bounds = L.latLngBounds([[loc.lat, loc.lonEast360], other]).pad(0.3);
        map.fitBounds(bounds, { maxZoom: 5, animate: true });
      } else {
        map.setView([loc.lat, loc.lonEast360], 4, { animate: true });
      }
    }
  };

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleFocusArcadia = () => mapRef.current?.setView([43.2, 182.0], 5, { animate: true });
  const handleFullMars = () => {
    const map = mapRef.current;
    map?.setView([0, 180.0], getGlobalMarsZoom(map), { animate: true });
  };

  const activeLoading =
    (mapMode === 'temperature' && tempLoadStatus === 'loading') ||
    (mapMode === 'storm' && stormLoadStatus === 'loading');

  const activeError =
    (mapMode === 'temperature' && tempLoadStatus === 'error' && tempLoadMessage) ||
    (mapMode === 'storm' && stormLoadStatus === 'error' && stormLoadMessage) ||
    null;

  const activeWarning =
    (mapMode === 'temperature' && tempLoadStatus === 'ready' && tempLoadMessage) ||
    (mapMode === 'storm' && stormLoadStatus === 'ready' && stormLoadMessage) ||
    null;

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8 space-y-4">
      {/* Page Title & Separate 2D Map Switcher */}
      <div className="flex flex-col gap-3 border-b border-white/10 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="text-xs font-mono text-[#F4845F]">
            Synchronized Planetary Cartography · Shared 3D/2D Mars Landmark Database
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            {mapMode === 'navigator' && '2D Mars Navigator & Route Planner'}
            {mapMode === 'temperature' && '2D Mars Surface Temperature Map'}
            {mapMode === 'storm' && '2D Mars Storm & Wind Map'}
          </h1>
        </div>

        {/* Clean 3-Map Mode Tabs */}
        <div
          role="tablist"
          aria-label="Select 2D Mars Map"
          className="inline-flex flex-wrap items-center gap-1.5 rounded-xl border border-white/15 bg-[#0D111A] p-1.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mapMode === 'navigator'}
            onClick={() => handleSwitchMapMode('navigator')}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              mapMode === 'navigator'
                ? 'bg-[#E05A2B] text-white shadow-sm'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Navigation className="h-4 w-4 shrink-0" />
            <span>Navigator Map</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mapMode === 'temperature'}
            onClick={() => handleSwitchMapMode('temperature')}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              mapMode === 'temperature'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Thermometer className="h-4 w-4 shrink-0" />
            <span>Temperature Map</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mapMode === 'storm'}
            onClick={() => handleSwitchMapMode('storm')}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              mapMode === 'storm'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <CloudLightning className="h-4 w-4 shrink-0" />
            <span>Storm &amp; Wind Map</span>
          </button>
        </div>
      </div>

      {/* Essential Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/12 bg-[#0D111A] p-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {mapMode === 'navigator' && (
            <>
              <button
                type="button"
                onClick={() =>
                  setClickMode((m) => (m === 'set_astronaut' ? 'inspect' : 'set_astronaut'))
                }
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  clickMode === 'set_astronaut'
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-300/60'
                    : 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                }`}
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>
                  {clickMode === 'set_astronaut'
                    ? 'Click Map or Landmark (Green)'
                    : 'Set Astronaut (Green)'}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setClickMode((m) => (m === 'set_destination' ? 'inspect' : 'set_destination'))
                }
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  clickMode === 'set_destination'
                    ? 'bg-red-600 text-white ring-2 ring-red-300/60'
                    : 'border border-red-500/40 bg-red-500/15 text-red-300 hover:bg-red-500/25'
                }`}
              >
                <Flag className="h-3.5 w-3.5" />
                <span>
                  {clickMode === 'set_destination'
                    ? 'Click Map or Landmark (Red)'
                    : 'Set Destination (Red)'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleClearMarkers}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/12 bg-[#141A28] px-3 py-2 text-xs font-medium text-slate-300 hover:bg-[#1C2438] hover:text-white cursor-pointer whitespace-nowrap"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear Markers</span>
              </button>
            </>
          )}

          {mapMode === 'temperature' && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-400 px-1 font-medium">Season / Local Time:</span>
              {TEMP_SCENARIO_LIST.map((sc) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => setTempScenario(sc.id)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    tempScenario === sc.id
                      ? 'bg-sky-600 text-white'
                      : 'border border-white/12 bg-[#141A28] text-slate-300 hover:bg-[#1C2438] hover:text-white'
                  }`}
                >
                  {sc.label}
                </button>
              ))}
            </div>
          )}

          {mapMode === 'storm' && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-400 px-1 font-medium">Dataset Scenario:</span>
              {STORM_SCENARIO_LIST.map((sc) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => setStormScenario(sc.id)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    stormScenario === sc.id
                      ? 'bg-amber-600 text-white'
                      : 'border border-white/12 bg-[#141A28] text-slate-300 hover:bg-[#1C2438] hover:text-white'
                  }`}
                >
                  {sc.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Zoom, Focus & Reset */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label="Zoom in"
            className="inline-flex items-center gap-1 rounded-md border border-white/12 bg-[#141A28] px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-[#1C2438] cursor-pointer"
          >
            <ZoomIn className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Zoom In</span>
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label="Zoom out"
            className="inline-flex items-center gap-1 rounded-md border border-white/12 bg-[#141A28] px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-[#1C2438] cursor-pointer"
          >
            <ZoomOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Zoom Out</span>
          </button>
          <button
            type="button"
            onClick={handleFocusArcadia}
            className="inline-flex items-center gap-1.5 rounded-md border border-white/12 bg-[#141A28] px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-[#1C2438] cursor-pointer whitespace-nowrap"
          >
            <Compass className="h-3.5 w-3.5 text-[#F4845F]" />
            <span>Arcadia</span>
          </button>
          <button
            type="button"
            onClick={handleFullMars}
            className="inline-flex items-center gap-1.5 rounded-md border border-white/12 bg-[#141A28] px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-[#1C2438] cursor-pointer whitespace-nowrap"
          >
            <Globe className="h-3.5 w-3.5 text-sky-400" />
            <span>Full Mars</span>
          </button>
          <button
            type="button"
            onClick={handleResetActiveMap}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#E05A2B]/50 bg-[#E05A2B]/15 px-3 py-1.5 text-xs font-semibold text-[#F4845F] hover:bg-[#E05A2B]/25 cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Dataset Warning or Basemap Fallback Banner (if triggered) */}
      {(activeWarning || basemapFallbackActive) && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3.5 py-2 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>
              {activeWarning ??
                'Live NASA Mars Trek surface tiles are temporarily slow or unreachable — displaying cached local 2K NASA Viking mosaic fallback.'}
            </span>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 items-start">
        {/* LEFT / CENTER COLUMN: Map Canvas + Legend Below */}
        <div className="lg:col-span-8 space-y-3">
          <div className="relative overflow-hidden rounded-xl border border-white/12 bg-[#07090E]">
            {/* Live Cursor Readout & Loading Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#0B0E15] px-3.5 py-2 text-xs">
              <div className="font-mono text-slate-200 tabular-nums">
                {formatMarsCoords(cursorInfo.lat, cursorInfo.lon)}
              </div>
              <div className="flex items-center gap-2 font-mono text-slate-400 tabular-nums">
                {basemapLoading && (
                  <span className="inline-flex items-center gap-1 text-sky-300">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Loading surface tiles...</span>
                  </span>
                )}
                {!basemapLoading && (
                  <span>
                    {mapMode === 'navigator'
                      ? cursorInfo.insideArcadia && cursorInfo.elevM !== null
                        ? `Arcadia MOLA Elev: ${cursorInfo.elevM} m`
                        : 'Click any landmark or terrain point'
                      : mapMode === 'temperature'
                      ? 'Click any landmark or surface point for temperature'
                      : 'Click any landmark or surface point for wind & storm data'}
                  </span>
                )}
              </div>
            </div>

            {mapMode === 'navigator' && clickMode !== 'inspect' && (
              <div
                className={`flex items-center justify-between px-3.5 py-2 text-xs font-medium border-b ${
                  clickMode === 'set_astronaut'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
                    : 'bg-red-500/20 border-red-500/40 text-red-200'
                }`}
              >
                <span>
                  {clickMode === 'set_astronaut'
                    ? 'Click anywhere on Mars—or click a landmark like Jezero Crater—to place the Green Astronaut dot.'
                    : 'Click anywhere on Mars—or click a landmark like Olympus Mons—to place the Red Destination dot.'}
                </span>
                <button
                  type="button"
                  onClick={() => setClickMode('inspect')}
                  className="underline hover:text-white cursor-pointer ml-3 shrink-0"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="relative">
              <div
                ref={mapContainerRef}
                className={`h-[460px] sm:h-[550px] lg:h-[610px] w-full ${
                  mapMode === 'navigator' && clickMode === 'inspect'
                    ? 'cursor-grab active:cursor-grabbing'
                    : 'cursor-crosshair'
                }`}
                aria-label="Interactive 2D Mars Map"
              />

              {/* Clear Loading Overlay while Temperature or Storm Dataset Loads */}
              {activeLoading && (
                <div className="absolute inset-0 z-[900] flex items-center justify-center bg-[#07090E]/75 backdrop-blur-xs p-4">
                  <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-[#0D111A] px-5 py-4 shadow-2xl text-sm text-white">
                    <Loader2 className="h-5 w-5 animate-spin text-[#E05A2B]" />
                    <span>
                      {mapMode === 'temperature'
                        ? 'Loading Mars Climate Database temperature dataset...'
                        : 'Loading Martian wind speed and dust-storm dataset...'}
                    </span>
                  </div>
                </div>
              )}

              {/* Clear Error Banner + Retry if Both Primary & Backup Dataset Fail */}
              {activeError && (
                <div className="absolute inset-x-4 top-4 z-[900] flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/50 bg-[#1A0D12]/95 px-4 py-3 text-xs text-red-100 shadow-2xl">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                    <span>{activeError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      mapMode === 'temperature' ? void fetchTempData(true) : void fetchStormData(true)
                    }
                    className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 font-semibold text-white hover:bg-red-500 cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Retry</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SHARED MARKER & COLOR LEGEND UNDER MAP */}
          <div className="rounded-xl border border-white/10 bg-[#0D111A] p-3.5 space-y-3">
            {/* Consistent Shared Marker Legend Across All 3 Maps */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rotate-45 bg-amber-500 border border-white shrink-0" />
                  <span>Major Mars Landmark (3D/2D Shared)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-sky-500 border border-white shrink-0" />
                  <span>Exploration / Rover Site (3D/2D Shared)</span>
                </div>
                {mapMode === 'navigator' && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white shrink-0" />
                      <span>Green = Start</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-3.5 w-3.5 rounded-full bg-red-500 border-2 border-white shrink-0" />
                      <span>Red = Destination</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-3.5 w-3.5 rounded bg-purple-600 border border-purple-200 shrink-0" />
                      <span>Purple = Proposed Base</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-3.5 w-3.5 rounded-sm bg-blue-500/70 border border-blue-400 shrink-0" />
                      <span>Blue = Potential Ice</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-3.5 w-3.5 rounded-sm bg-orange-500/70 border border-orange-400 shrink-0" />
                      <span>Orange = Hazard / Inspection</span>
                    </div>
                  </>
                )}
              </div>

              {mapMode === 'navigator' && (
                <button
                  type="button"
                  onClick={() => setLayersDrawerOpen((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/12 bg-[#141A28] px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-[#1C2438] cursor-pointer whitespace-nowrap"
                >
                  <Layers className="h-3.5 w-3.5 text-[#F4845F]" />
                  <span>Map Overlays</span>
                  {layersDrawerOpen ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>

            {mapMode === 'navigator' && layersDrawerOpen && (
              <div className="pt-2.5 border-t border-white/10 flex flex-wrap gap-4 text-xs text-slate-300">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showArcadiaLayers}
                    onChange={(e) => setShowArcadiaLayers(e.target.checked)}
                    className="h-4 w-4 accent-[#E05A2B] cursor-pointer"
                  />
                  <span>Show Arcadia Study Overlays (Ice, Stops A–D, Hazards, HiRISE)</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showElevationRelief}
                    onChange={(e) => setShowElevationRelief(e.target.checked)}
                    className="h-4 w-4 accent-[#E05A2B] cursor-pointer"
                  />
                  <span>Show MOLA Elevation Shaded Relief (NASA MGS)</span>
                </label>
              </div>
            )}

            {mapMode === 'temperature' && (
              <div className="pt-2.5 border-t border-white/10 space-y-2">
                <div className="font-display text-xs font-bold text-white uppercase tracking-wider">
                  Surface Temperature Scale (°C) · Coverage: 85°S – 85°N
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  {TEMPERATURE_LEGEND_BANDS.map((band) => (
                    <div
                      key={band.label}
                      className="flex items-center gap-2 rounded-md border border-white/10 bg-[#121723] px-2.5 py-1.5"
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-sm shrink-0 border border-white/25"
                        style={{ backgroundColor: band.hex }}
                      />
                      <div className="min-w-0 leading-tight">
                        <div className="font-semibold text-white">{band.label}</div>
                        <div className="font-mono text-[11px] text-slate-300 tabular-nums">
                          {band.rangeText}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mapMode === 'storm' && (
              <div className="pt-2.5 border-t border-white/10 space-y-2">
                <div className="font-display text-xs font-bold text-white uppercase tracking-wider">
                  Martian Wind Speed &amp; Dust-Storm Activity · Coverage: 85°S – 85°N
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                  {STORM_LEGEND_BANDS.map((band) => (
                    <div
                      key={band.label}
                      className="flex items-start gap-2 rounded-md border border-white/10 bg-[#121723] px-2.5 py-1.5"
                    >
                      <span
                        className="mt-0.5 h-3.5 w-3.5 rounded-sm shrink-0 border border-white/25"
                        style={{ backgroundColor: band.hex }}
                      />
                      <div className="min-w-0 leading-tight">
                        <div className="font-semibold text-white">{band.label}</div>
                        <div className="text-[11px] text-slate-300">{band.windSummary}</div>
                        <div className="text-[10px] text-slate-400">{band.dustSummary}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: INSPECTOR & ROUTE PLANNER */}
        <aside className="lg:col-span-4 space-y-4">
          {/* ---------------- NAVIGATOR PANEL ---------------- */}
          {mapMode === 'navigator' && (
            <>
              <div className="rounded-xl border border-white/10 bg-[#0D111A] p-4 space-y-3.5">
                <div>
                  <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
                    <RouteIcon className="h-4 w-4 text-emerald-400" />
                    <span>Simple Route Planner</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Click any point or landmark on Mars—or pick a famous Martian location below—to
                    plan a route between the <strong>Green</strong> and <strong>Red</strong> dots.
                  </p>
                </div>

                {isDefaultExample && astronautPos && destinationPos && (
                  <div className="rounded-md border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-[11px] text-sky-200">
                    Example route from Proposed Base to Stop B. Click{' '}
                    <strong>Set Astronaut</strong> / <strong>Set Destination</strong>, drag dots,
                    or click any landmark like Olympus Mons or Jezero Crater.
                  </div>
                )}

                <div className="space-y-2 text-xs">
                  <div className="rounded-lg border border-emerald-500/25 bg-[#111722] p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-400">
                        Green Dot · Astronaut Starting Point
                      </span>
                      <button
                        type="button"
                        onClick={() => setClickMode('set_astronaut')}
                        className="text-[11px] text-slate-300 hover:text-white underline cursor-pointer"
                      >
                        Click Map
                      </button>
                    </div>
                    <div className="font-mono text-slate-200 tabular-nums">
                      {astronautPos
                        ? formatMarsCoords(astronautPos[0], astronautPos[1])
                        : 'Not placed — click Set Astronaut (Green)'}
                    </div>
                    <select
                      aria-label="Choose famous Martian landmark as starting point"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) handleSelectLandmarkAsPoint('start', e.target.value);
                      }}
                      className="w-full rounded border border-white/10 bg-[#0B0E15] px-2 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Or select a Mars landmark as Start...</option>
                      {MARS_LOCATIONS.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="rounded-lg border border-red-500/25 bg-[#111722] p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-red-400">
                        Red Dot · Destination
                      </span>
                      <button
                        type="button"
                        onClick={() => setClickMode('set_destination')}
                        className="text-[11px] text-slate-300 hover:text-white underline cursor-pointer"
                      >
                        Click Map
                      </button>
                    </div>
                    <div className="font-mono text-slate-200 tabular-nums">
                      {destinationPos
                        ? formatMarsCoords(destinationPos[0], destinationPos[1])
                        : 'Not placed — click Set Destination (Red)'}
                    </div>
                    <select
                      aria-label="Choose famous Martian landmark as destination"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) handleSelectLandmarkAsPoint('dest', e.target.value);
                      }}
                      className="w-full rounded border border-white/10 bg-[#0B0E15] px-2 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-red-500"
                    >
                      <option value="">Or select a Mars landmark as Destination...</option>
                      {MARS_LOCATIONS.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {routeResult ? (
                  <div className="space-y-3 border-t border-white/10 pt-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg border border-white/10 bg-[#121723] p-2.5">
                        <div className="text-slate-400">Distance</div>
                        <div className="font-mono text-lg font-bold text-emerald-400 tabular-nums mt-0.5">
                          {routeResult.distanceKm} km
                        </div>
                        <div className="text-[11px] text-slate-500 tabular-nums">
                          Direct: {routeResult.straightLineKm} km
                        </div>
                      </div>

                      <div className="rounded-lg border border-white/10 bg-[#121723] p-2.5">
                        <div className="text-slate-400">Terrain Elevation</div>
                        <div className="font-mono text-base font-bold text-white tabular-nums mt-0.5">
                          {routeResult.elevationAvailable && routeResult.elevationGainM !== null
                            ? `+${routeResult.elevationGainM} m gain`
                            : 'Unavailable'}
                        </div>
                        <div className="text-[11px] text-slate-500 tabular-nums">
                          {routeResult.elevationAvailable &&
                          routeResult.minElevationM !== null &&
                          routeResult.maxElevationM !== null
                            ? `${routeResult.minElevationM} to ${routeResult.maxElevationM} m`
                            : 'Outside Arcadia MOLA grid'}
                        </div>
                      </div>

                      <div className="rounded-lg border border-white/10 bg-[#121723] p-2.5">
                        <div className="text-slate-400">Approx. Walking Time</div>
                        <div className="font-mono text-base font-bold text-white tabular-nums mt-0.5">
                          ~{routeResult.walkingHours} hrs
                        </div>
                        <div className="text-[11px] text-slate-500">Assumes 3.5 km/h EVA</div>
                      </div>

                      <div className="rounded-lg border border-white/10 bg-[#121723] p-2.5">
                        <div className="text-slate-400">Approx. Rover Driving</div>
                        <div className="font-mono text-base font-bold text-white tabular-nums mt-0.5">
                          ~{routeResult.roverHours} hrs
                        </div>
                        <div className="text-[11px] text-slate-500">Assumes 12 km/h drive</div>
                      </div>
                    </div>

                    {routeResult.routeMode === 'arcadia_terrain' ? (
                      <div className="rounded-md border border-white/10 bg-[#121723] p-2.5 text-slate-300 space-y-1">
                        <div className="font-semibold text-white">
                          Terrain Along Arcadia Route
                        </div>
                        <p className="leading-relaxed">
                          {routeResult.hazardsNearRoute.length > 0
                            ? `Passes near: ${routeResult.hazardsNearRoute.join(' · ')}.`
                            : 'Crosses gently sloping Arcadia northern lowland plains.'}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-md border border-amber-500/25 bg-amber-500/10 p-2.5 text-amber-200 leading-relaxed">
                        Detailed slope and terrain-hazard data are unavailable outside the Arcadia
                        Planitia study corridor; showing a spherical Mars great-circle route.
                      </div>
                    )}

                    <div className="rounded-md border border-white/10 bg-[#0B0E15] p-2.5 text-[11px] text-slate-400 leading-relaxed">
                      <strong className="text-slate-300">Estimate Notice:</strong> Distances use
                      true Martian coordinates (R = 3,389.5 km). Walking and rover driving times are
                      rough educational estimates—not guaranteed travel durations or mission safety
                      assessments.
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md border border-white/10 bg-[#111622] p-3 text-xs text-slate-300">
                    Place both the <strong>Green Astronaut dot</strong> and{' '}
                    <strong>Red Destination dot</strong> to calculate distance and estimated travel
                    times.
                  </div>
                )}
              </div>

              {/* Selected Landmark / Feature Information Panel */}
              {selectedNavFeature && (
                <div className="rounded-xl border border-white/10 bg-[#0D111A] p-4 space-y-2.5 text-xs">
                  <div className="font-display text-sm font-bold text-white">
                    Selected Location Details
                  </div>

                  {selectedNavFeature.kind === 'location' && (
                    <div className="space-y-2.5">
                      <div className="text-amber-400 font-semibold">
                        {selectedNavFeature.data.type} · Elev. {selectedNavFeature.data.elevationKm} km
                      </div>
                      <h3 className="font-display text-base font-bold text-white">
                        {selectedNavFeature.data.name}
                      </h3>
                      <div className="font-mono text-[11px] text-slate-300 tabular-nums">
                        {formatMarsCoords(
                          selectedNavFeature.data.lat,
                          selectedNavFeature.data.lonEast360
                        )}
                      </div>
                      <div className="overflow-hidden rounded-md border border-white/10 aspect-[16/10] bg-[#121723]">
                        <img
                          src={selectedNavFeature.data.imageUrl}
                          alt={selectedNavFeature.data.name}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        {selectedNavFeature.data.summary}
                      </p>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectLandmarkAsPoint('start', selectedNavFeature.data.id)
                          }
                          className="rounded bg-emerald-600 px-2.5 py-2 text-[11px] font-semibold text-white hover:bg-emerald-500 cursor-pointer"
                        >
                          Set as Start (Green)
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectLandmarkAsPoint('dest', selectedNavFeature.data.id)
                          }
                          className="rounded bg-red-600 px-2.5 py-2 text-[11px] font-semibold text-white hover:bg-red-500 cursor-pointer"
                        >
                          Set as Destination (Red)
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedNavFeature.kind === 'stop' && (
                    <>
                      <div className="text-yellow-400 font-semibold">
                        Yellow · {selectedNavFeature.data.code}
                      </div>
                      <h3 className="font-display text-base font-bold text-white">
                        {selectedNavFeature.data.name}
                      </h3>
                      <p className="text-slate-300 leading-relaxed">
                        {selectedNavFeature.data.researchValue}
                      </p>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setAstronautPos([
                              selectedNavFeature.data.lat,
                              selectedNavFeature.data.lonE
                            ]);
                            setIsDefaultExample(false);
                          }}
                          className="rounded bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-500 cursor-pointer"
                        >
                          Set as Start (Green)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDestinationPos([
                              selectedNavFeature.data.lat,
                              selectedNavFeature.data.lonE
                            ]);
                            setIsDefaultExample(false);
                          }}
                          className="rounded bg-red-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-red-500 cursor-pointer"
                        >
                          Set as Destination (Red)
                        </button>
                      </div>
                    </>
                  )}

                  {selectedNavFeature.kind === 'ice' && (
                    <>
                      <div className="text-blue-400 font-semibold">
                        Blue · Potential Subsurface Ice
                      </div>
                      <h3 className="font-display text-base font-bold text-white">
                        {selectedNavFeature.data.name}
                      </h3>
                      <p className="text-slate-300 leading-relaxed">
                        {selectedNavFeature.data.limitations}
                      </p>
                    </>
                  )}

                  {selectedNavFeature.kind === 'hazard' && (
                    <>
                      <div className="flex items-center gap-1.5 text-orange-400 font-semibold">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>{selectedNavFeature.data.status}</span>
                      </div>
                      <h3 className="font-display text-base font-bold text-white">
                        {selectedNavFeature.data.name}
                      </h3>
                      <p className="text-slate-300 leading-relaxed">
                        {selectedNavFeature.data.whyItMatters}
                      </p>
                    </>
                  )}

                  {selectedNavFeature.kind === 'hirise' && (
                    <>
                      <div className="text-sky-400 font-semibold">
                        {selectedNavFeature.data.obsId} ({selectedNavFeature.data.resolution})
                      </div>
                      <h3 className="font-display text-base font-bold text-white">
                        {selectedNavFeature.data.title}
                      </h3>
                      <p className="text-slate-300 leading-relaxed">
                        {selectedNavFeature.data.summary}
                      </p>
                    </>
                  )}

                  {selectedNavFeature.kind === 'habitat' && (
                    <>
                      <div className="text-purple-400 font-semibold">
                        Purple · Proposed Habitat / Base
                      </div>
                      <h3 className="font-display text-base font-bold text-white">
                        {PROPOSED_HABITAT.name}
                      </h3>
                      <p className="text-slate-300 leading-relaxed">
                        {PROPOSED_HABITAT.description}
                      </p>
                    </>
                  )}

                  {selectedNavFeature.kind === 'point' && (
                    <>
                      <div className="font-mono text-sm font-bold text-white tabular-nums">
                        {formatMarsCoords(selectedNavFeature.lat, selectedNavFeature.lon)}
                      </div>
                      {selectedNavFeature.insideArcadia && selectedNavFeature.elevationM !== null ? (
                        <div className="text-slate-300">
                          Arcadia MOLA Elevation:{' '}
                          <strong className="text-white">{selectedNavFeature.elevationM} m</strong>{' '}
                          · Slope:{' '}
                          <strong className="text-white">{selectedNavFeature.slopeDeg}°</strong>
                        </div>
                      ) : (
                        <div className="text-slate-400">
                          Outside Arcadia study grid — NASA Viking global terrain shown; detailed
                          elevation/slope unavailable.
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setAstronautPos([selectedNavFeature.lat, selectedNavFeature.lon]);
                            setIsDefaultExample(false);
                          }}
                          className="rounded bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-500 cursor-pointer"
                        >
                          Set as Start (Green)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDestinationPos([selectedNavFeature.lat, selectedNavFeature.lon]);
                            setIsDefaultExample(false);
                          }}
                          className="rounded bg-red-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-red-500 cursor-pointer"
                        >
                          Set as Destination (Red)
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {/* ---------------- TEMPERATURE MAP PANEL ---------------- */}
          {mapMode === 'temperature' && (
            <div className="rounded-xl border border-white/10 bg-[#0D111A] p-4 space-y-4 text-xs">
              <div>
                <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-sky-400" />
                  <span>Surface Temperature Details</span>
                </h2>
                <p className="text-slate-400 mt-0.5">
                  Click any Martian landmark or anywhere on the map to inspect temperature data.
                </p>
              </div>

              {!tempQuery.available ? (
                <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 p-3.5 space-y-2">
                  <div className="font-semibold text-amber-300">
                    {tempQuery.unavailableReason ?? 'Temperature data unavailable for this location.'}
                  </div>
                  <div className="font-mono text-slate-200 tabular-nums">
                    {formatMarsCoords(tempQuery.lat, tempQuery.lonE)}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border border-white/10 bg-[#121723] p-3 space-y-1">
                    <div className="text-[11px] uppercase tracking-wider text-slate-400">
                      Selected Location
                    </div>
                    <div className="font-display text-base font-bold text-white">
                      {selectedTempLocation?.name ??
                        tempQuery.locationName ??
                        'Unnamed Martian Surface Location'}
                    </div>
                    <div className="font-mono text-slate-300 tabular-nums">
                      {formatMarsCoords(tempQuery.lat, tempQuery.lonE)}
                    </div>
                    {(selectedTempLocation?.summary || tempQuery.regionNote) && (
                      <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                        {selectedTempLocation?.summary ?? tempQuery.regionNote}
                      </p>
                    )}
                  </div>

                  <div className="rounded-lg border border-white/12 bg-[#121723] p-3.5 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-slate-400">Surface Temperature</div>
                      <div className="font-mono text-3xl font-bold text-white tabular-nums mt-0.5">
                        {tempQuery.tempC! > 0 ? `+${tempQuery.tempC}` : tempQuery.tempC} °C
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        Band: <strong>{tempQuery.band?.label}</strong> ({tempQuery.band?.rangeText})
                      </div>
                    </div>
                    <div
                      className="h-11 w-11 rounded-lg border-2 border-white/40 shrink-0"
                      style={{ backgroundColor: tempQuery.band?.hex }}
                      aria-hidden="true"
                    />
                  </div>

                  <div className="space-y-2 rounded-lg border border-white/10 bg-[#111622] p-3">
                    <div>
                      <span className="text-slate-400">Measurement / Model Type:</span>{' '}
                      <span className="font-semibold text-sky-300">{tempQuery.dataType}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Date / Time Period:</span>{' '}
                      <span className="text-slate-200">{tempQuery.period}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Source:</span>{' '}
                      <span className="text-slate-200">{tempQuery.source}</span>
                    </div>
                  </div>
                </div>
              )}

              {(selectedTempStation || tempQuery.nearestStation) && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-1.5">
                  {(() => {
                    const st = selectedTempStation ?? tempQuery.nearestStation!.station;
                    const distKm = selectedTempStation
                      ? 0
                      : Math.round(tempQuery.nearestStation!.distanceKm);
                    return (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-emerald-300">{st.tempMethod}</span>
                          {!selectedTempStation && (
                            <span className="text-[10px] font-mono text-emerald-200/80">
                              ~{distKm} km away
                            </span>
                          )}
                        </div>
                        <div className="font-display font-bold text-white text-sm">
                          {st.mission} — {st.name}
                        </div>
                        <div className="text-slate-200">
                          <strong>Observed Range:</strong> {st.tempRangeC}
                        </div>
                        <p className="text-slate-300 leading-relaxed">{st.tempMeasuredSummary}</p>
                        <div className="text-[11px] text-slate-300">
                          <strong>Period:</strong> {st.measurementPeriod} ·{' '}
                          <strong>Instrument:</strong> {st.instrument}
                        </div>
                        <a
                          href={st.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[#F4845F] hover:underline pt-0.5"
                        >
                          <span>{st.sourceLabel}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="flex items-start gap-2 rounded-md border border-white/10 bg-[#0B0E15] p-2.5 text-[11px] text-slate-400 leading-relaxed">
                <Info className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  Temperatures reflect Mars Climate Database (MCD v6.2, grounded in NASA MGS TES
                  &amp; Odyssey THEMIS observations) and NASA rover records. Temperatures vary
                  strongly with season, time of day, latitude, and elevation.
                </span>
              </div>
            </div>
          )}

          {/* ---------------- STORM & WIND MAP PANEL ---------------- */}
          {mapMode === 'storm' && (
            <div className="rounded-xl border border-white/10 bg-[#0D111A] p-4 space-y-4 text-xs">
              <div>
                <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
                  <Wind className="h-4 w-4 text-amber-400" />
                  <span>Martian Wind &amp; Storm Details</span>
                </h2>
                <p className="text-slate-400 mt-0.5">
                  Click any Martian landmark or anywhere on the map to inspect wind speed,
                  direction, and dust activity.
                </p>
              </div>

              {!stormQuery.available ? (
                <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 p-3.5 space-y-2">
                  <div className="font-semibold text-amber-300">
                    {stormQuery.unavailableReason ??
                      'Wind and dust-storm data unavailable for this location.'}
                  </div>
                  <div className="font-mono text-slate-200 tabular-nums">
                    {formatMarsCoords(stormQuery.lat, stormQuery.lonE)}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border border-white/10 bg-[#121723] p-3 space-y-1">
                    <div className="text-[11px] uppercase tracking-wider text-slate-400">
                      Selected Location
                    </div>
                    <div className="font-display text-base font-bold text-white">
                      {selectedStormLocation?.name ??
                        stormQuery.locationName ??
                        'Unnamed Martian Surface Location'}
                    </div>
                    <div className="font-mono text-slate-300 tabular-nums">
                      {formatMarsCoords(stormQuery.lat, stormQuery.lonE)}
                    </div>
                    {(selectedStormLocation?.summary || stormQuery.regionNote) && (
                      <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                        {selectedStormLocation?.summary ?? stormQuery.regionNote}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-white/12 bg-[#121723] p-3">
                      <div className="text-slate-400">Wind Speed (10 m)</div>
                      <div className="font-mono text-xl font-bold text-white tabular-nums mt-0.5">
                        {stormQuery.windMs} m/s
                      </div>
                      <div className="font-mono text-[11px] text-slate-400 tabular-nums">
                        {stormQuery.windKmh} km/h
                      </div>
                    </div>

                    <div className="rounded-lg border border-white/12 bg-[#121723] p-3">
                      <div className="text-slate-400">Dust Optical Depth</div>
                      <div className="font-mono text-xl font-bold text-white tabular-nums mt-0.5">
                        τ = {stormQuery.tau}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-300 mt-0.5">
                        <span
                          className="h-2.5 w-2.5 rounded-sm shrink-0"
                          style={{ backgroundColor: stormQuery.band?.hex }}
                        />
                        <span className="truncate">{stormQuery.band?.label}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-[#121723] p-3 space-y-1.5">
                    <div>
                      <span className="text-slate-400">Wind Direction:</span>{' '}
                      <strong className="text-white">{stormQuery.windDirection}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Dust Storm Activity:</span>{' '}
                      <strong className="text-white">{stormQuery.dustStatus}</strong>
                    </div>
                    <p className="text-slate-300 leading-relaxed pt-1 border-t border-white/10">
                      {stormQuery.conditionsSummary}
                    </p>
                  </div>

                  <div className="space-y-1.5 rounded-lg border border-white/10 bg-[#111622] p-3">
                    <div>
                      <span className="text-slate-400">Data Type:</span>{' '}
                      <span className="font-semibold text-amber-300">{stormQuery.dataType}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Date / Time Period:</span>{' '}
                      <span className="text-slate-200">{stormQuery.period}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Source:</span>{' '}
                      <span className="text-slate-200">{stormQuery.source}</span>
                    </div>
                  </div>
                </div>
              )}

              {(selectedStormStation || stormQuery.nearestStation) && (
                <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 space-y-1.5">
                  {(() => {
                    const st = selectedStormStation ?? stormQuery.nearestStation!.station;
                    const distKm = selectedStormStation
                      ? 0
                      : Math.round(stormQuery.nearestStation!.distanceKm);
                    return (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-sky-300">
                            Directly Measured / Historical NASA Observation
                          </span>
                          {!selectedStormStation && (
                            <span className="text-[10px] font-mono text-sky-200/80">
                              ~{distKm} km away
                            </span>
                          )}
                        </div>
                        <div className="font-display font-bold text-white text-sm">
                          {st.mission} — {st.name}
                        </div>
                        <div className="text-slate-200">
                          <strong>Measured Winds:</strong> {st.windRangeMs}
                        </div>
                        <div className="text-slate-300">
                          <strong>Direction Pattern:</strong> {st.windDirectionNote}
                        </div>
                        <div className="text-slate-300">
                          <strong>Dust Activity:</strong> {st.dustTauSummary}
                        </div>
                        <p className="text-slate-300 leading-relaxed">{st.stormActivityNote}</p>
                        <div className="text-[11px] text-slate-300">
                          <strong>Dates:</strong> {st.measurementPeriod}
                        </div>
                        <a
                          href={st.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[#F4845F] hover:underline pt-0.5"
                        >
                          <span>{st.sourceLabel}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="flex items-start gap-2 rounded-md border border-white/10 bg-[#0B0E15] p-2.5 text-[11px] text-slate-400 leading-relaxed">
                <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Because Mars’s air density is ~1% of Earth’s, high wind speeds exert gentler
                  force than Earth storms—yet lift planet-wide dust clouds that dim sunlight.
                </span>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
