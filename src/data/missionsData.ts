export type MissionCategory =
  | 'Orbiter'
  | 'Lander'
  | 'Rover';

export type ResearchFocus =
  | 'Atmospheric research'
  | 'Surface exploration';

export type MissionStatus = 'Active' | 'Historical';

export interface MarsMission {
  id: string;
  name: string;
  organization: string;
  type: MissionCategory;
  researchFocus: ResearchFocus[];
  launchYear: number;
  status: MissionStatus;
  operationalPeriod: string;
  landingOrOrbitSite: string;
  shortDescription: string;
  mainObjective: string;
  keyInstruments: string[];
  scientificContributions: string;
  imageUrl: string;
  imageCaption: string;
  imageCredit: string;
  imageSourceUrl: string;
  officialMissionUrl: string;
}

export const NASA_MISSIONS: MarsMission[] = [
  {
    id: 'perseverance',
    name: 'Perseverance (Mars 2020)',
    organization: 'NASA / JPL',
    type: 'Rover',
    researchFocus: ['Surface exploration', 'Atmospheric research'],
    launchYear: 2020,
    status: 'Active',
    operationalPeriod: 'Landed Feb 18, 2021 — Active',
    landingOrOrbitSite: 'Jezero Crater (18.38°N, 77.58°E)',
    shortDescription:
      'Nuclear-powered astrobiology rover investigating an ancient river delta in Jezero Crater, caching core samples, and operating the MEDA weather station.',
    mainObjective:
      'Seek signs of ancient microbial life, characterize climate and geology, cache samples for potential return to Earth, and test oxygen production (MOXIE).',
    keyInstruments: ['MEDA', 'Mastcam-Z', 'SHERLOC', 'PIXL', 'RIMFAX', 'SuperCam', 'MOXIE'],
    scientificContributions:
      'Confirmed lake-delta sedimentary sequences in Jezero Crater, produced oxygen from Martian CO₂, and provides continuous Jezero boundary-layer meteorology via MEDA.',
    imageUrl: '/Mars-explored/assets/nasa/perseverance.jpg',
    imageCaption: 'Perseverance rover self-portrait with the Ingenuity helicopter in Jezero Crater.',
    imageCredit: 'NASA/JPL-Caltech/MSSS (PIA24542)',
    imageSourceUrl: 'https://images.nasa.gov/details/PIA24542',
    officialMissionUrl: 'https://science.nasa.gov/mission/mars-2020-perseverance/'
  },
  {
    id: 'curiosity',
    name: 'Curiosity (Mars Science Laboratory)',
    organization: 'NASA / JPL',
    type: 'Rover',
    researchFocus: ['Surface exploration', 'Atmospheric research'],
    launchYear: 2011,
    status: 'Active',
    operationalPeriod: 'Landed Aug 6, 2012 — Active',
    landingOrOrbitSite: 'Gale Crater (5.4°S, 137.8°E)',
    shortDescription:
      'Long-lived analytical rover ascending Mount Sharp in Gale Crater to study ancient habitable lakebeds and measure surface radiation with RAD.',
    mainObjective:
      'Assess whether Gale Crater ever offered environmental conditions favorable for microbial life and quantify surface radiation hazards for future astronauts.',
    keyInstruments: ['RAD', 'SAM', 'CheMin', 'ChemCam', 'REMS', 'MAHLI', 'Mastcam'],
    scientificContributions:
      'Demonstrated long-lived ancient freshwater lakes, detected organic carbon in mudstones, and captured Gale Crater RAD dosimetry (~210 µGy/day in the first ~10 months).',
    imageUrl: '/Mars-explored/assets/nasa/curiosity.jpg',
    imageCaption: 'Curiosity rover self-portrait at the Glen Etive clay-bearing unit on Mount Sharp.',
    imageCredit: 'NASA/JPL-Caltech/MSSS (PIA23378)',
    imageSourceUrl: 'https://images.nasa.gov/details/PIA23378',
    officialMissionUrl: 'https://science.nasa.gov/mission/msl-curiosity/'
  },
  {
    id: 'mro',
    name: 'Mars Reconnaissance Orbiter (MRO)',
    organization: 'NASA / JPL',
    type: 'Orbiter',
    researchFocus: ['Surface exploration', 'Atmospheric research'],
    launchYear: 2005,
    status: 'Active',
    operationalPeriod: 'Entered Mars orbit Mar 2006 — Active',
    landingOrOrbitSite: 'Sun-synchronous polar orbit (~255–320 km)',
    shortDescription:
      'Primary high-resolution reconnaissance orbiter carrying HiRISE, CTX, and the SHARAD subsurface radar sounder used throughout the Arcadia Planitia expedition map.',
    mainObjective:
      'Map Martian landforms at meter-to-submeter scales, probe underground water-ice layers with radar, track seasonal weather, and serve as data relay for surface missions.',
    keyInstruments: ['HiRISE', 'CTX', 'SHARAD', 'CRISM', 'MCS', 'MARCI'],
    scientificContributions:
      'Returned hundreds of thousands of CTX and HiRISE images and enabled SHARAD mapping of subsurface ice sheets in Arcadia Planitia and Utopia Planitia.',
    imageUrl: '/Mars-explored/assets/nasa/mro.jpg',
    imageCaption: 'Mars Reconnaissance Orbiter spacecraft configuration with high-gain antenna and solar arrays.',
    imageCredit: 'NASA/JPL-Caltech (PIA07214)',
    imageSourceUrl: 'https://images.nasa.gov/details/PIA07214',
    officialMissionUrl: 'https://science.nasa.gov/mission/mars-reconnaissance-orbiter/'
  },
  {
    id: 'odyssey',
    name: '2001 Mars Odyssey',
    organization: 'NASA / JPL',
    type: 'Orbiter',
    researchFocus: ['Surface exploration', 'Atmospheric research'],
    launchYear: 2001,
    status: 'Active',
    operationalPeriod: 'Entered Mars orbit Oct 2001 — Active',
    landingOrOrbitSite: 'Sun-synchronous polar orbit (~400 km)',
    shortDescription:
      'Longest-operating spacecraft at Mars, carrying the THEMIS thermal-infrared/visible imager and gamma-ray spectrometer that mapped near-surface hydrogen.',
    mainObjective:
      'Map global elemental composition, surface thermal properties, mineralogy, and radiation environment while supporting surface rover communications.',
    keyInstruments: ['THEMIS', 'GRS', 'MARIE'],
    scientificContributions:
      'GRS detected widespread near-surface hydrogen in high latitudes, and THEMIS global daytime/nighttime thermal inertia maps distinguish rocky terrain from loose dust.',
    imageUrl: '/Mars-explored/assets/nasa/odyssey.jpg',
    imageCaption: 'Artist concept of the 2001 Mars Odyssey orbiter mapping Mars.',
    imageCredit: 'NASA/JPL (PIA04244)',
    imageSourceUrl: 'https://images.nasa.gov/details/PIA04244',
    officialMissionUrl: 'https://science.nasa.gov/mission/odyssey/'
  },
  {
    id: 'maven',
    name: 'MAVEN',
    organization: 'NASA / GSFC / CU LASP',
    type: 'Orbiter',
    researchFocus: ['Atmospheric research'],
    launchYear: 2013,
    status: 'Active',
    operationalPeriod: 'Entered Mars orbit Sep 2014 — Active',
    landingOrOrbitSite: 'Elliptical upper-atmosphere orbit',
    shortDescription:
      'Dedicated atmospheric evolution orbiter measuring how solar wind and ultraviolet radiation strip gas from Mars’s upper atmosphere into space.',
    mainObjective:
      'Determine the role that loss of atmospheric gases to space played in transforming ancient warm, wet Mars into a cold desert planet.',
    keyInstruments: ['NGIMS', 'IUVS', 'SWIA', 'STATIC', 'MAG', 'LPW'],
    scientificContributions:
      'Quantified present-day atmospheric escape rates during solar storms and showed how Mars lost most of its early thick atmosphere.',
    imageUrl: '/Mars-explored/assets/nasa/maven.jpg',
    imageCaption: 'Artist concept of the MAVEN spacecraft sampling Mars’s upper atmosphere and ionosphere.',
    imageCredit: 'NASA/GSFC (PIA17487)',
    imageSourceUrl: 'https://images.nasa.gov/details/PIA17487',
    officialMissionUrl: 'https://science.nasa.gov/mission/maven/'
  },
  {
    id: 'insight',
    name: 'InSight',
    organization: 'NASA / JPL / CNES / DLR',
    type: 'Lander',
    researchFocus: ['Surface exploration'],
    launchYear: 2018,
    status: 'Historical',
    operationalPeriod: 'Nov 2018 — Dec 2022',
    landingOrOrbitSite: 'Elysium Planitia (4.50°N, 135.62°E)',
    shortDescription:
      'Stationary geophysical lander equipped with an ultra-sensitive seismometer to probe Mars’s crust, mantle, and liquid core.',
    mainObjective:
      'Measure Martian seismic activity (marsquakes), meteorite impacts, and planetary heat flow to understand terrestrial planet formation.',
    keyInstruments: ['SEIS', 'HP³', 'RISE', 'TWINS'],
    scientificContributions:
      'Recorded over 1,300 marsquakes, constrained Martian crustal thickness (24–72 km) and core radius (~1,830 km), and tracked dust-driven power loss.',
    imageUrl: '/Mars-explored/assets/nasa/insight.jpg',
    imageCaption: 'InSight’s SEIS seismometer resting on the Elysium Planitia regolith.',
    imageCredit: 'NASA/JPL-Caltech (PIA22956)',
    imageSourceUrl: 'https://images.nasa.gov/details/PIA22956',
    officialMissionUrl: 'https://science.nasa.gov/mission/insight/'
  },
  {
    id: 'opportunity',
    name: 'Opportunity (MER-B)',
    organization: 'NASA / JPL',
    type: 'Rover',
    researchFocus: ['Surface exploration'],
    launchYear: 2003,
    status: 'Historical',
    operationalPeriod: 'Jan 2004 — Jun 2018 (5,111 sols)',
    landingOrOrbitSite: 'Meridiani Planum (1.95°S, 354.47°E)',
    shortDescription:
      'Solar-powered geologist rover that traversed 45.16 km across Meridiani Planum, uncovering mineral evidence of ancient groundwater.',
    mainObjective:
      'Search for and characterize rocks and soils that hold clues to past water activity on Mars.',
    keyInstruments: ['Pancam', 'Mini-TES', 'Mössbauer', 'APXS', 'MI', 'RAT'],
    scientificContributions:
      'Discovered hematite spherules and sulfate-rich sedimentary rocks deposited in ancient wet environments before succumbing to the 2018 global dust storm.',
    imageUrl: '/Mars-explored/assets/nasa/opportunity.jpg',
    imageCaption: 'Stereo panorama of Martian terrain surveyed by Opportunity on Sol 3105.',
    imageCredit: 'NASA/JPL-Caltech/Cornell/ASU (PIA16559)',
    imageSourceUrl: 'https://images.nasa.gov/details/PIA16559',
    officialMissionUrl: 'https://science.nasa.gov/mission/mer-opportunity/'
  },
  {
    id: 'spirit',
    name: 'Spirit (MER-A)',
    organization: 'NASA / JPL',
    type: 'Rover',
    researchFocus: ['Surface exploration'],
    launchYear: 2003,
    status: 'Historical',
    operationalPeriod: 'Jan 2004 — Mar 2010 (2,208 sols)',
    landingOrOrbitSite: 'Gusev Crater (14.57°S, 175.47°E)',
    shortDescription:
      'Twin rover to Opportunity that investigated volcanic plains and ancient hydrothermal silica outcrops in the Columbia Hills of Gusev Crater.',
    mainObjective:
      'Analyze Martian rocks and soils in Gusev Crater for geological records of ancient water and habitable hydrothermal settings.',
    keyInstruments: ['Pancam', 'Mini-TES', 'Mössbauer', 'APXS', 'MI', 'RAT'],
    scientificContributions:
      'Uncovered silica-rich deposits at Home Plate indicative of ancient hot springs or volcanic steam vents.',
    imageUrl: '/Mars-explored/assets/nasa/spirit.jpg',
    imageCaption: 'Spirit rover hardware and surface view in Gusev Crater.',
    imageCredit: 'NASA/JPL-Caltech/Cornell (PIA05040)',
    imageSourceUrl: 'https://images.nasa.gov/details/PIA05040',
    officialMissionUrl: 'https://science.nasa.gov/mission/mer-spirit/'
  },
  {
    id: 'pathfinder',
    name: 'Mars Pathfinder & Sojourner',
    organization: 'NASA / JPL',
    type: 'Lander',
    researchFocus: ['Surface exploration', 'Atmospheric research'],
    launchYear: 1996,
    status: 'Historical',
    operationalPeriod: 'Jul 1997 — Sep 1997 (83 sols)',
    landingOrOrbitSite: 'Ares Vallis (19.13°N, 326.78°E)',
    shortDescription:
      'Demonstrated airbag-cushioned landing and deployed Sojourner—the first wheeled robotic rover to operate on another planet.',
    mainObjective:
      'Validate low-cost entry, descent, and landing technology while analyzing flood-deposited rocks and atmospheric dust in Ares Vallis.',
    keyInstruments: ['IMP Camera', 'ASI/MET', 'APXS (Sojourner)'],
    scientificContributions:
      'Proved mobile surface robotics on Mars and analyzed rounded pebbles and conglomerate boulders left by catastrophic ancient floods.',
    imageUrl: '/Mars-explored/assets/nasa/pathfinder.jpg',
    imageCaption: 'Sojourner rover inspecting a Martian boulder near the Pathfinder lander in Ares Vallis.',
    imageCredit: 'NASA/JPL (PIA01122)',
    imageSourceUrl: 'https://images.nasa.gov/details/PIA01122',
    officialMissionUrl: 'https://science.nasa.gov/mission/mars-pathfinder/'
  },
  {
    id: 'viking-1',
    name: 'Viking 1',
    organization: 'NASA / Langley / JPL',
    type: 'Lander',
    researchFocus: ['Surface exploration', 'Atmospheric research'],
    launchYear: 1975,
    status: 'Historical',
    operationalPeriod: 'Jul 1976 — Nov 1982 (2,245 sols)',
    landingOrOrbitSite: 'Chryse Planitia (22.27°N, 312.05°E)',
    shortDescription:
      'First spacecraft to achieve long-term surface operations on Mars, paired with an orbiter that mapped global Martian terrain.',
    mainObjective:
      'Acquire high-resolution orbital and surface imagery, characterize atmospheric composition and weather, and search for signs of Martian microbial metabolism.',
    keyInstruments: ['Lander Imaging System', 'GC-MS', 'Biology Package', 'Meteorology Boom', 'VIS Orbiter Cameras'],
    scientificContributions:
      'Provided the MDIM global visual basemap mosaic and six years of surface meteorology and regolith chemistry in Chryse Planitia.',
    imageUrl: '/Mars-explored/assets/nasa/viking1.jpg',
    imageCaption: 'Viking Lander 1 surface view in Chryse Planitia.',
    imageCredit: 'NASA/JPL (PIA00565)',
    imageSourceUrl: 'https://images.nasa.gov/details/PIA00565',
    officialMissionUrl: 'https://science.nasa.gov/mission/viking-1/'
  },
  {
    id: 'viking-2',
    name: 'Viking 2',
    organization: 'NASA / Langley / JPL',
    type: 'Lander',
    researchFocus: ['Surface exploration', 'Atmospheric research'],
    launchYear: 1975,
    status: 'Historical',
    operationalPeriod: 'Sep 1976 — Apr 1980 (1,281 sols)',
    landingOrOrbitSite: 'Utopia Planitia (47.97°N, 134.26°E)',
    shortDescription:
      'Northern mid-latitude lander that operated in Utopia Planitia, observing seasonal winter water-ice frost on the rocky northern plains.',
    mainObjective:
      'Investigate northern plains geology, atmosphere, seasonal frost cycles, and potential biosignatures at higher latitude than Viking 1.',
    keyInstruments: ['Lander Imaging System', 'GC-MS', 'Biology Package', 'Seismometer', 'Meteorology Boom'],
    scientificContributions:
      'Documented thin seasonal water-ice frost in Utopia Planitia and provided northern mid-latitude atmospheric pressure cycles.',
    imageUrl: '/Mars-explored/assets/nasa/viking2.jpg',
    imageCaption: 'Viking Lander 2 panoramic surface view across rocky Utopia Planitia.',
    imageCredit: 'NASA/JPL (PIA04023)',
    imageSourceUrl: 'https://images.nasa.gov/details/PIA04023',
    officialMissionUrl: 'https://science.nasa.gov/mission/viking-2/'
  }
];

export interface InstrumentRow {
  instrument: string;
  mission: string;
  measures: string;
  expeditionValue: string;
  nonInterchangeabilityNote: string;
  sourceUrl: string;
}

export const SCIENTIFIC_INSTRUMENTS: InstrumentRow[] = [
  {
    instrument: 'MRO — HiRISE',
    mission: 'Mars Reconnaissance Orbiter',
    measures: 'Ultra-high-resolution visible & near-IR surface imagery (~0.25–0.5 m/pixel)',
    expeditionValue:
      'Identifies individual boulders, small craters, steep scarps, polygonal cracks, and surface obstacles where coverage exists.',
    nonInterchangeabilityNote: 'Optical surface camera only; covers targeted narrow strips rather than 100% of Mars, and cannot see underground.',
    sourceUrl: 'https://science.nasa.gov/mission/mars-reconnaissance-orbiter/science-instruments/'
  },
  {
    instrument: 'MRO — CTX',
    mission: 'Mars Reconnaissance Orbiter',
    measures: 'Wider-area monochrome context imagery (~6 m/pixel, 30 km swath width)',
    expeditionValue:
      'Maps broad landscapes, crater distributions, ridges, and regional route corridors to select sites for HiRISE follow-up.',
    nonInterchangeabilityNote: 'Coarser than HiRISE; cannot resolve small rover-scale rocks under ~15–20 m across.',
    sourceUrl: 'https://science.nasa.gov/mission/mars-reconnaissance-orbiter/science-instruments/'
  },
  {
    instrument: 'MRO — SHARAD',
    mission: 'Mars Reconnaissance Orbiter',
    measures: 'Shallow subsurface radar reflections (15–25 MHz, ~15 m vertical resolution in ice)',
    expeditionValue:
      'Detects dielectric interfaces below the surface to investigate possible buried water-ice sheets and overburden thickness.',
    nonInterchangeabilityNote: 'Probes underground radar interfaces—does not capture photographs and cannot prove exposed surface ice by itself.',
    sourceUrl: 'https://science.nasa.gov/mission/mars-reconnaissance-orbiter/science-instruments/'
  },
  {
    instrument: 'Mars Odyssey — THEMIS',
    mission: '2001 Mars Odyssey',
    measures: 'Visible (18 m/px) & multispectral thermal-infrared imagery (100 m/px)',
    expeditionValue:
      'Compares daytime/nighttime thermal inertia to distinguish loose, rapidly cooling dust from dense bedrock and rocky fields.',
    nonInterchangeabilityNote: 'Measures thermal properties and infrared radiance—not a direct weather forecast or high-res boulder camera.',
    sourceUrl: 'https://science.nasa.gov/mission/odyssey/science-instruments/'
  },
  {
    instrument: 'Mars Global Surveyor — MOLA',
    mission: 'Mars Global Surveyor',
    measures: 'Laser altimetry surface elevation and global planetary topography',
    expeditionValue:
      'Identifies regional elevation changes, basin floors, crater rims, and broad slope gradients relative to the Martian datum.',
    nonInterchangeabilityNote: 'Provides gridded topographic elevation (~463 m/px global DEM), not optical photographs or meter-scale roughness.',
    sourceUrl: 'https://science.nasa.gov/mission/mars-global-surveyor/science-instruments/'
  },
  {
    instrument: 'Curiosity — RAD',
    mission: 'Mars Science Laboratory (Curiosity)',
    measures: 'Galactic cosmic ray & solar energetic particle radiation dose at Gale Crater',
    expeditionValue:
      'Provides empirical surface radiation benchmarks (~210 µGy/day over Curiosity’s first ~10 months) for astronaut shielding studies.',
    nonInterchangeabilityNote: 'Direct measurements come exclusively from Gale Crater (5.4°S), NOT Arcadia Planitia.',
    sourceUrl: 'https://science.nasa.gov/resource/radiation-measurements-on-mars/'
  },
  {
    instrument: 'Perseverance — MEDA',
    mission: 'Mars 2020 (Perseverance)',
    measures: 'Wind speed/direction, air & ground temperature, pressure, humidity, dust, & radiation at Jezero Crater',
    expeditionValue:
      'Documents real Martian diurnal weather and dust-lifting physics to inform surface suit and habitat engineering.',
    nonInterchangeabilityNote: 'Direct environmental observations come exclusively from Jezero Crater (18.38°N), NOT Arcadia Planitia.',
    sourceUrl: 'https://science.nasa.gov/mission/mars-2020-perseverance/science-instruments/'
  }
];
