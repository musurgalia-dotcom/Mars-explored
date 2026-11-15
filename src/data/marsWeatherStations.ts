export interface MeasuredStationRecord {
  id: string;
  name: string;
  mission: string;
  instrument: string;
  lat: number;
  lonE: number;
  elevationNote: string;
  measurementPeriod: string;
  tempMeasuredSummary: string;
  tempRangeC: string;
  tempMethod: 'Directly Measured (in-situ rover/lander sensor)';
  windMeasuredSummary: string;
  windRangeMs: string;
  windDirectionNote: string;
  dustTauSummary: string;
  stormActivityNote: string;
  sourceLabel: string;
  sourceUrl: string;
}

export const MEASURED_MARS_STATIONS: MeasuredStationRecord[] = [
  {
    id: 'perseverance-jezero',
    name: 'Jezero Crater',
    mission: 'Mars 2020 Perseverance Rover',
    instrument: 'MEDA (Mars Environmental Dynamics Analyzer)',
    lat: 18.38,
    lonE: 77.58,
    elevationNote: '−2,570 m below Mars datum',
    measurementPeriod: 'Feb 2021 – Ongoing (MY 36–37, Ls 6°–360°)',
    tempMeasuredSummary:
      'Air (~1.5 m) ranges from roughly −83°C pre-dawn to −20°C afternoon; sunlit surface ground temperature spans −88°C at night up to +15°C in warm afternoon seasons.',
    tempRangeC: '−88°C to +15°C (surface diurnal)',
    tempMethod: 'Directly Measured (in-situ rover/lander sensor)',
    windMeasuredSummary:
      'Ambient surface winds typically 2–10 m/s with daytime upslope gusts exceeding 15–20 m/s and frequent convective dust devils (~1+ vortex/sol).',
    windRangeMs: '2–10 m/s (gusts >15–20 m/s)',
    windDirectionNote: 'Diurnally reversing crater rim/delta slope winds (SE–NW)',
    dustTauSummary: 'Clear baseline τ ≈ 0.3–0.8; regional dust events exceed τ > 1.5',
    stormActivityNote:
      'Direct in-situ MEDA observations of local dust-lifting vortices and passing regional dust clouds.',
    sourceLabel: 'NASA Mars 2020 MEDA / PDS Atmospheres',
    sourceUrl: 'https://science.nasa.gov/mission/mars-2020-perseverance/science-instruments/'
  },
  {
    id: 'curiosity-gale',
    name: 'Gale Crater',
    mission: 'Mars Science Laboratory Curiosity Rover',
    instrument: 'REMS (Rover Environmental Monitoring Station) & Mastcam Tau',
    lat: -4.59,
    lonE: 137.44,
    elevationNote: '−4,500 m below Mars datum',
    measurementPeriod: 'Aug 2012 – Ongoing (MY 31–37)',
    tempMeasuredSummary:
      'REMS ground brightness temperature ranges from −90°C pre-dawn to +24°C on sunlit low-albedo sand/bedrock; air temperature ranges from −85°C to +6°C across seasons.',
    tempRangeC: '−90°C to +24°C (surface diurnal)',
    tempMethod: 'Directly Measured (in-situ rover/lander sensor)',
    windMeasuredSummary:
      'Typical crater-floor winds of 2–10 m/s modulated by Mount Sharp slope-wind circulation.',
    windRangeMs: '2–10 m/s typical surface winds',
    windDirectionNote: 'Crater-rim & Mount Sharp katabatic/anabatic slope circulation',
    dustTauSummary: 'Baseline τ ≈ 0.4–1.0; peaked at τ > 8.0 during 2018 Global Dust Storm',
    stormActivityNote:
      'Recorded unprecedented optical depth >8.0 inside Gale Crater during the June–July 2018 (MY 34) planet-encircling dust storm.',
    sourceLabel: 'NASA MSL REMS / PDS Archive',
    sourceUrl: 'https://science.nasa.gov/mission/msl-curiosity/science-instruments/'
  },
  {
    id: 'insight-elysium',
    name: 'Elysium Planitia',
    mission: 'InSight Lander',
    instrument: 'TWINS (Temperature & Winds for InSight) / APSS',
    lat: 4.5,
    lonE: 135.62,
    elevationNote: '−2,660 m below Mars datum',
    measurementPeriod: 'Nov 2018 – Dec 2022 (MY 34–36)',
    tempMeasuredSummary:
      'TWINS measured near-surface air temperatures swinging from −96°C pre-dawn to −4°C in afternoon warmth.',
    tempRangeC: '−96°C to −4°C (air diurnal range)',
    tempMethod: 'Directly Measured (in-situ rover/lander sensor)',
    windMeasuredSummary:
      'Continuous twice-per-second wind monitoring often recorded 5–15 m/s daytime winds with gusts up to 16–17 m/s.',
    windRangeMs: '5–15 m/s (gusts 16–17 m/s)',
    windDirectionNote: 'Dominantly SE–NW seasonal trade-wind & thermal-tide rotation',
    dustTauSummary: 'Doubled optical depth (τ > 2.0) during late-2022 regional dust storms',
    stormActivityNote:
      'Tracked continent-scale southern regional dust storms in 2022 that coated solar panels and ended the mission in Dec 2022.',
    sourceLabel: 'NASA InSight APSS / TWINS Archive',
    sourceUrl: 'https://science.nasa.gov/mission/insight/'
  },
  {
    id: 'viking1-chryse',
    name: 'Chryse Planitia (Viking 1)',
    mission: 'Viking Lander 1',
    instrument: 'VMIS (Viking Meteorology Instrument System)',
    lat: 22.27,
    lonE: 312.05,
    elevationNote: '−3,600 m below Mars datum',
    measurementPeriod: 'Jul 1976 – Nov 1982 (MY 12–15)',
    tempMeasuredSummary:
      'Measured air temperatures at ~1.6 m ranged from −84°C pre-dawn lows to −14°C during northern summer afternoons.',
    tempRangeC: '−84°C to −14°C (1.6 m air)',
    tempMethod: 'Directly Measured (in-situ rover/lander sensor)',
    windMeasuredSummary:
      'Typical quiet-season winds of 2–7 m/s, escalating to 15–25+ m/s gusts during the 1977 global dust storms.',
    windRangeMs: '2–7 m/s (storm gusts 15–25+ m/s)',
    windDirectionNote: 'Seasonal planetary & regional plains flow',
    dustTauSummary: 'Baseline τ ≈ 0.4–0.6; spiked above τ > 3.0 in 1977 dust storms',
    stormActivityNote:
      'First long-term in-situ surface meteorological station capturing two 1977 planet-encircling dust storms.',
    sourceLabel: 'NASA Viking PDS Atmospheres Archive',
    sourceUrl: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html'
  },
  {
    id: 'viking2-utopia',
    name: 'Utopia Planitia (Viking 2)',
    mission: 'Viking Lander 2',
    instrument: 'VMIS (Viking Meteorology Instrument System)',
    lat: 47.97,
    lonE: 134.26,
    elevationNote: '−4,400 m below Mars datum',
    measurementPeriod: 'Sep 1976 – Apr 1980 (MY 12–14)',
    tempMeasuredSummary:
      'Mid-northern plains air temperatures plunged to −120°C in winter (depositing surface water-ice frost) and reached −22°C in summer.',
    tempRangeC: '−120°C to −22°C (1.6 m air)',
    tempMethod: 'Directly Measured (in-situ rover/lander sensor)',
    windMeasuredSummary:
      'Typical 2–7 m/s summer winds, with mid-latitude winter baroclinic storm fronts driving gusts past 15–20 m/s.',
    windRangeMs: '2–7 m/s (winter storm fronts >15–20 m/s)',
    windDirectionNote: 'Baroclinic mid-latitude frontal wind shifts',
    dustTauSummary: 'Summer τ ≈ 0.3–0.6; storm seasons τ > 2.0–3.0',
    stormActivityNote:
      'Captured baroclinic mid-latitude weather fronts and winter dust-storm passages across the northern plains.',
    sourceLabel: 'NASA Viking 2 / JPL Utopia Surface Archive',
    sourceUrl: 'https://www.jpl.nasa.gov/images/pia17633-utopia-planitias-surface/'
  },
  {
    id: 'phoenix-vastitas',
    name: 'Vastitas Borealis (Phoenix)',
    mission: 'Phoenix Mars Lander',
    instrument: 'MET Meteorological Station & TECP Soil Probe',
    lat: 68.22,
    lonE: 234.25,
    elevationNote: '−4,100 m below Mars datum',
    measurementPeriod: 'May – Nov 2008 (MY 29, Ls 76.5°–148°)',
    tempMeasuredSummary:
      'Arctic summer air spanned −80°C at night to −30°C in the afternoon; shallow icy soil probe measured −92°C to −20°C.',
    tempRangeC: '−92°C to −20°C (Arctic summer)',
    tempMethod: 'Directly Measured (in-situ rover/lander sensor)',
    windMeasuredSummary:
      'Arctic boundary-layer winds averaged 4–6 m/s (ranging 2–10 m/s), accompanied by passing dust devils.',
    windRangeMs: '2–10 m/s (typical 4–6 m/s)',
    windDirectionNote: 'Polar-cap summer circulation & daytime convective eddies',
    dustTauSummary: 'Northern summer τ ≈ 0.2–0.6 (comparatively clear)',
    stormActivityNote:
      'Observed late-summer polar ice clouds, virga snowfall, and minor dust events before polar winter darkness.',
    sourceLabel: 'NASA Phoenix Mission / PDS',
    sourceUrl: 'https://science.nasa.gov/mission/phoenix/'
  },
  {
    id: 'opportunity-meridiani',
    name: 'Meridiani Planum',
    mission: 'Mars Exploration Rover Opportunity',
    instrument: 'Mini-TES Infrared Spectrometer & Pancam Solar Tau',
    lat: -1.95,
    lonE: 354.47,
    elevationNote: '−1,400 m below Mars datum',
    measurementPeriod: 'Jan 2004 – Jun 2018 (MY 26–34)',
    tempMeasuredSummary:
      'Mini-TES infrared measurements of dark basaltic plains recorded ground brightness temperatures from −95°C pre-dawn up to +20°C at noon.',
    tempRangeC: '−95°C to +20°C (Mini-TES surface)',
    tempMethod: 'Directly Measured (in-situ rover/lander sensor)',
    windMeasuredSummary:
      'Long-term dust-clearing events and Pancam dust-devil tracks indicate gusting equatorial winds; direct anemometer was not carried.',
    windRangeMs: 'Direct wind speed not measured (no anemometer)',
    windDirectionNote: 'Aeolian dune ripple orientation indicates NW–SE transport',
    dustTauSummary: 'Tracked τ from ~0.4 baseline to >4.5 (2007) and >10.8 (2018 storm)',
    stormActivityNote:
      'Measured extreme optical depth >10.8 during the June 2018 MY 34 Global Dust Storm, cutting sunlight below survival levels.',
    sourceLabel: 'NASA MER Opportunity / PDS Archive',
    sourceUrl: 'https://images.nasa.gov/details/PIA16559'
  }
];

export interface NamedMarsRegion {
  id: string;
  name: string;
  lat: number;
  lonE: number;
  radiusDeg: number;
  contextNote: string;
}

export const NAMED_MARS_REGIONS: NamedMarsRegion[] = [
  {
    id: 'arcadia-planitia',
    name: 'Arcadia Planitia',
    lat: 44.0,
    lonE: 184.0,
    radiusDeg: 14,
    contextNote: 'Smooth northern lowland plains (~−3.9 km elevation) with buried mid-latitude water-ice deposits.'
  },
  {
    id: 'olympus-mons',
    name: 'Olympus Mons',
    lat: 18.65,
    lonE: 226.2,
    radiusDeg: 7,
    contextNote: 'Highest volcano in the solar system (+21.9 km datum); extreme low pressure (~0.5–0.7 mbar) drives steep diurnal cooling.'
  },
  {
    id: 'tharsis-rise',
    name: 'Tharsis Volcanic Plateau',
    lat: 4.0,
    lonE: 252.0,
    radiusDeg: 18,
    contextNote: 'Elevated volcanic province (+7 to +18 km) experiencing strong thermal slope winds and thin air.'
  },
  {
    id: 'valles-marineris',
    name: 'Valles Marineris',
    lat: -13.9,
    lonE: 300.8,
    radiusDeg: 11,
    contextNote: '4,000-km rift canyon (−7 km depth) with denser air and warmer exposed rocky canyon floors.'
  },
  {
    id: 'hellas-planitia',
    name: 'Hellas Planitia',
    lat: -42.4,
    lonE: 70.5,
    radiusDeg: 16,
    contextNote: 'Deepest Martian impact basin (−7.15 km); higher air pressure (~11.6 mbar) and frequent dust-storm ignition.'
  },
  {
    id: 'argyre-planitia',
    name: 'Argyre Planitia',
    lat: -49.7,
    lonE: 316.0,
    radiusDeg: 10,
    contextNote: 'Deep southern highland impact basin (~−5.2 km) subject to cold polar winters and southern dust-storm tracks.'
  },
  {
    id: 'syrtis-major',
    name: 'Syrtis Major Planum',
    lat: 8.4,
    lonE: 69.5,
    radiusDeg: 12,
    contextNote: 'Dark low-albedo basaltic volcanic shield that absorbs more daytime solar heat than bright dusty regions.'
  },
  {
    id: 'acidalia-planitia',
    name: 'Acidalia Planitia',
    lat: 49.8,
    lonE: 339.3,
    radiusDeg: 14,
    contextNote: 'Broad northern dark lowland plain; common winter baroclinic storm track feeding southward toward Chryse.'
  },
  {
    id: 'planum-boreum',
    name: 'Planum Boreum (North Polar Cap)',
    lat: 82.0,
    lonE: 15.0,
    radiusDeg: 10,
    contextNote: 'Permanent water-ice dome with seasonal winter CO₂ dry-ice frost reaching ~−130°C to −143°C.'
  },
  {
    id: 'planum-australe',
    name: 'Planum Australe (South Polar Cap)',
    lat: -82.0,
    lonE: 140.0,
    radiusDeg: 10,
    contextNote: 'High-elevation southern polar cap retaining perennial solid CO₂ ice under extended southern winters.'
  }
];
