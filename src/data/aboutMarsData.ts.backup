export interface PdfBiome {
  id: string;
  title: string;
  originalLabel: string;
  summary: string;
  details: string;
  imageUrl: string;
  pdfPage: string;
  attribution: string;
  sourceUrl: string;
}

export const PDF_BIOMES: PdfBiome[] = [
  {
    id: 'ice-biome',
    title: 'Ice Biome',
    originalLabel: 'Ice Biome — ледяные регионы (PDF Page 2)',
    summary:
      'Exposed subsurface water-ice sheets and stratified polar/mid-latitude ice deposits preserved beneath shallow regolith.',
    details:
      'Orbital observations from Mars Reconnaissance Orbiter (HiRISE and SHARAD) and Mars Odyssey show thick layers of water ice buried just beneath the dusty surface at mid-to-high latitudes, exposed along steep eroded scarps.',
    imageUrl: '/assets/pdf/pdf_img_1.jpg',
    pdfPage: 'Original PDF Page 2',
    attribution: 'NASA/JPL-Caltech/UArizona (PIA22077 — Underground Martian Ice Deposit Exposed at Scarp)',
    sourceUrl: 'https://images.nasa.gov/details/PIA22077'
  },
  {
    id: 'canyons',
    title: 'Canyons',
    originalLabel: 'Canyons — каньоны (PDF Page 3)',
    summary:
      'Vast tectonic rift troughs, gullied cliff walls, and wind-sculpted sedimentary floors exemplified by Valles Marineris.',
    details:
      'Stretching over 4,000 km along the Martian equator, Martian canyon systems expose deep vertical sections of ancient volcanic and sedimentary crust shaped by rifting, landslides, and ancient water erosion.',
    imageUrl: '/assets/pdf/pdf_img_2.jpg',
    pdfPage: 'Original PDF Page 3',
    attribution: 'Included in author project PDF (nasaais_c5566504.pdf, Page 3)',
    sourceUrl: 'https://science.nasa.gov/mars/facts/#h-surface'
  },
  {
    id: 'volcanic-plains',
    title: 'Volcanic Plains',
    originalLabel: 'Volcanic Plains — вулканические равнины (PDF Page 4)',
    summary:
      'Massive basaltic shield volcanoes and broad lava plateaus formed by prolonged hotspot volcanism without plate tectonics.',
    details:
      'Olympus Mons and the surrounding Tharsis volcanic plains represent the largest volcanic structures in the solar system, surrounded by broad northern volcanic plains such as Arcadia Planitia and Elysium Planitia.',
    imageUrl: '/assets/pdf/pdf_img_3.jpg',
    pdfPage: 'Original PDF Page 4',
    attribution: 'Included in author project PDF (nasaais_c5566504.pdf, Page 4) / NASA Viking Orbiter',
    sourceUrl: 'https://images.nasa.gov/details/PIA03821'
  }
];

export const PDF_FUTURE_EXPLORATION_IMAGE = {
  imageUrl: '/assets/pdf/pdf_img_4.jpg',
  caption:
    'Concept illustration of future astronaut surface EVA and pressurized rover reconnaissance on Mars (Original PDF Page 5).',
  attribution: 'Included in author project PDF (nasaais_c5566504.pdf, Page 5)'
};

export interface SeasonInfo {
  northernSeason: string;
  southernSeason: string;
  durationSols: number;
  note: string;
}

export const MARTIAN_SEASONS: SeasonInfo[] = [
  {
    northernSeason: 'Northern Spring',
    southernSeason: 'Southern Autumn',
    durationSols: 194,
    note: 'Longest Martian season (194 sols); Mars moves more slowly near aphelion.'
  },
  {
    northernSeason: 'Northern Summer',
    southernSeason: 'Southern Winter',
    durationSols: 178,
    note: '178 sols; northern polar CO₂ frost sublimates completely, exposing water ice.'
  },
  {
    northernSeason: 'Northern Autumn',
    southernSeason: 'Southern Spring',
    durationSols: 142,
    note: 'Shortest Martian season (142 sols; listed as "142 days" in the source PDF prose referring to Martian sols); Mars moves fastest near perihelion.'
  },
  {
    northernSeason: 'Northern Winter',
    southernSeason: 'Southern Summer',
    durationSols: 154,
    note: '154 sols; peak global dust storm season often initiates during southern spring/summer.'
  }
];

export interface EnvironmentalFactorRow {
  factor: string;
  martianInfo: string;
  whyItMatters: string;
}

export const ENVIRONMENTAL_CONDITIONS: EnvironmentalFactorRow[] = [
  {
    factor: 'Atmospheric pressure',
    martianInfo: 'Mean surface pressure is about 6.36 millibars (< 1% of Earth sea-level pressure), varying with elevation and seasonal CO₂ condensation.',
    whyItMatters: 'Far below the Armstrong limit; humans require a pressurized spacesuit and pressurized habitat at all times.'
  },
  {
    factor: 'Temperature',
    martianInfo: 'Global mean is about 214 K (−59°C), spanning roughly −153°C (−225°F) at polar winter to +20°C (70°F) at equatorial midday, with sharp vertical gradients.',
    whyItMatters: 'Extreme diurnal thermal swings stress seals, electronics, lubricants, and battery thermal management.'
  },
  {
    factor: 'Atmosphere',
    martianInfo: 'Approximately 95% carbon dioxide (~95.3% CO₂, ~2.6% N₂, ~1.9% Ar, trace O₂ and H₂O vapor).',
    whyItMatters: 'Unbreathable by humans; requires closed-loop oxygen life support or ISRU conversion (such as MOXIE).'
  },
  {
    factor: 'Wind',
    martianInfo: 'Varies widely with local topography, thermal slopes, and seasonal global circulation.',
    whyItMatters: 'While low air density reduces dynamic wind force compared with Earth, winds lift and transport fine abrasive dust.'
  },
  {
    factor: 'Dust',
    martianInfo: 'Suspended fine iron-oxide dust can grow into regional or planet-encircling dust storms lasting months before settling.',
    whyItMatters: 'Reduces surface visibility, coats solar arrays and optical sensors, and infiltrates suit bearings and airlocks.'
  },
  {
    factor: 'Radiation',
    martianInfo: 'Without a global magnetic field or thick atmosphere, galactic cosmic rays (GCRs) and solar energetic particles (SEPs) reach the surface.',
    whyItMatters: 'Requires continuous dosimetry, regolith/water habitat shielding, and solar storm shelter protocols.'
  }
];

export interface ChecklistItem {
  id: string;
  category: string;
  label: string;
  detail: string;
}

export const MARSWALK_CHECKLIST: ChecklistItem[] = [
  {
    id: 'wind',
    category: 'Environment',
    label: 'Wind conditions',
    detail: 'Review regional orbital dust-front advisories and local boundary-layer wind estimates.'
  },
  {
    id: 'temp',
    category: 'Environment',
    label: 'Air and ground temperature',
    detail: 'Confirm surface temperature window relative to suit thermal loop limits (note sharp vertical gradients between feet and helmet).'
  },
  {
    id: 'dust',
    category: 'Environment',
    label: 'Dust and visibility',
    detail: 'Verify optical opacity (tau), solar irradiance, and visor/camera dust-mitigation readiness.'
  },
  {
    id: 'radiation',
    category: 'Safety',
    label: 'Radiation information',
    detail: 'Check solar particle alert status and cumulative EVA dose budget (referencing Curiosity RAD benchmarks while noting site differences).'
  },
  {
    id: 'suit',
    category: 'Hardware',
    label: 'Spacesuit condition',
    detail: 'Validate primary/backup O₂ pressure, CO₂ scrubber capacity, battery charge, and joint dust-seal integrity.'
  },
  {
    id: 'rover',
    category: 'Hardware',
    label: 'Rover condition',
    detail: 'Inspect unpressurized/pressurized rover tire traction, wheel actuators, and terrain-clearance margin along planned stops.'
  },
  {
    id: 'comms',
    category: 'Operations',
    label: 'Communication status',
    detail: 'Confirm UHF/S-band line-of-sight to habitat mast and scheduled MRO/Odyssey/MAVEN orbital relay passes.'
  },
  {
    id: 'route',
    category: 'Navigation',
    label: 'Return route',
    detail: 'Verify planned green return traverse avoids red boulder fields and steep crater rims, with reserve consumable margin.'
  },
  {
    id: 'habitat',
    category: 'Operations',
    label: 'Habitat status',
    detail: 'Confirm airlock depressurization/repressurization readiness, power reserve, and medical bay status at base.'
  }
];
