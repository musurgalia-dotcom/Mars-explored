export interface MarsLocation {
  id: string;
  name: string;
  type: string;
  markerCategory: 'landmark' | 'exploration';
  lat: number;
  lon: number; // -180 to 180 (East positive, West negative)
  lonEast360: number; // 0 to 360 East
  elevationKm: number;
  elevationNote: string;
  summary: string;
  geology: string;
  facts: string[];
  scientificImportance: string;
  futureExploration: string;
  imageUrl: string;
  imageCaption: string;
  imageSourceLabel: string;
  imageSourceUrl: string;
  sourceLinks: { label: string; url: string }[];
  featuredStop?: boolean;
  shortLabel?: string;
  stationId?: string;
}

export const MARS_LOCATIONS: MarsLocation[] = [
  {
    id: 'olympus-mons',
    name: 'Olympus Mons',
    type: 'Shield volcano',
    markerCategory: 'landmark',
    lat: 18.65,
    lon: -133.8,
    lonEast360: 226.2,
    elevationKm: 21.9,
    elevationNote:
      '21.9 km above the Martian areoid datum (MOLA reference equipotential surface), rising roughly 25–26 km above the surrounding northwestern Tharsis plains.',
    summary:
      'The largest known volcano in the solar system, spanning roughly 600 km across its base and bounded by a steep basal scarp up to 8 km tall.',
    geology:
      'Built by thousands of overlapping basaltic lava flows over hundreds of millions of years. Because Mars lacks active Earth-like plate tectonics, a stationary mantle hotspot fed magma into the same crust point continuously.',
    facts: [
      'Its summit caldera complex consists of six overlapping collapse craters measuring roughly 85 km by 60 km.',
      'Its footprint of ~300,000 km² is comparable to the area of Arizona or Poland.',
      'Because the flank slope averages only ~5 degrees, an observer standing on the flank would not immediately perceive it as a steep mountain.',
      'The basal cliff (Olympus Rupes) drops precipitously up to 8 km in places onto the surrounding aureole deposits.'
    ],
    scientificImportance:
      'Preserves a multi-billion-year volcanic record of Martian mantle evolution, lithospheric thickness, and crustal loading.',
    futureExploration:
      'High-altitude thin air (~0.7 mbar at summit) makes Olympus Mons unsuitable for landing, but orbital spectroscopy and flank lava tubes are of major interest for astrobiology and cave-shelter research.',
    imageUrl: '/Mars-explored/assets/pdf/pdf_img_3.jpg',
    imageCaption: 'Olympus Mons and surrounding Tharsis volcanic plains observed from orbit (PDF Page 4 / Viking Orbiter).',
    imageSourceLabel: 'NASA/JPL Viking Orbiter & PIA03821',
    imageSourceUrl: 'https://images.nasa.gov/details/PIA03821',
    sourceLinks: [
      { label: 'NASA Mars Facts — Surface & Volcanoes', url: 'https://science.nasa.gov/mars/facts/#h-surface' },
      { label: 'NASA Photojournal — Mars Topography (MOLA)', url: 'https://science.nasa.gov/photojournal/mars-topography/' },
      { label: 'USGS Geologic Map of Mars (SIM 3292)', url: 'https://doi.org/10.3133/sim3292' }
    ]
  },
  {
    id: 'valles-marineris',
    name: 'Valles Marineris',
    type: 'Tectonic canyon system',
    markerCategory: 'landmark',
    lat: -13.9,
    lon: -59.2,
    lonEast360: 300.8,
    elevationKm: -7.0,
    elevationNote:
      'Canyon floors drop to approximately -7 km relative to the Mars MOLA datum, sitting 7 to 10 km below the surrounding Tharsis plateau.',
    summary:
      'A 4,000-kilometer-long equatorial rift and canyon network stretching nearly one-fifth of Mars’s circumference.',
    geology:
      'Formed primarily by crustal stretching and rifting during the uplift of the Tharsis volcanic bulge, later widened by massive landslides, structural collapse, and ancient outflow channel erosion.',
    facts: [
      'Up to 200 km wide and up to 7 km deep—roughly four times deeper and ten times longer than Earth’s Grand Canyon.',
      'Central troughs such as Melas Chasma, Candor Chasma, and Coprates Chasma expose layered sedimentary rocks and hydrated sulfate minerals.',
      'Wall spurs and gullies show massive debris aprons formed by dry avalanches and possible ancient groundwater sapping.'
    ],
    scientificImportance:
      'Exposes kilometers of stratified Martian crust in vertical cross-section, offering a direct window into Mars’s early hydrological and volcanic history.',
    futureExploration:
      'Deep canyon floors have higher atmospheric pressure (~10–12 mbar) than the Martian mean, though steep cliffs and landslide hazards challenge landing precision.',
    imageUrl: '/Mars-explored/assets/pdf/pdf_img_2.jpg',
    imageCaption: 'Steep layered canyon walls and wind-sculpted floor deposits in Valles Marineris (PDF Page 3 / Mars Express).',
    imageSourceLabel: 'NASA/JPL PIA13077 — Floor of Ius Chasma',
    imageSourceUrl: 'https://images.nasa.gov/details/PIA13077',
    sourceLinks: [
      { label: 'NASA Mars Exploration — Geology', url: 'https://science.nasa.gov/mars/facts/#h-surface' },
      { label: 'NASA JPL PIA13077 — Ius Chasma', url: 'https://images.nasa.gov/details/PIA13077' }
    ]
  },
  {
    id: 'north-polar-cap',
    name: 'Planum Boreum (North Polar Ice Cap)',
    shortLabel: 'North Polar Cap',
    type: 'Polar layered ice dome',
    markerCategory: 'landmark',
    lat: 83.9,
    lon: 15.0,
    lonEast360: 15.0,
    elevationKm: 2.5,
    elevationNote:
      'Rises roughly 2.5 to 3 km above the surrounding northern Vastitas Borealis lowlands.',
    summary:
      'A ~1,100 km-wide permanent dome of water-ice and dust layers capped seasonally by a thin veneer of carbon dioxide dry ice.',
    geology:
      'Composed of finely laminated Polar Layered Deposits (PLD) up to 3 km thick, incised by spiral troughs such as Chasma Boreale carved by katabatic winds and sublimation.',
    facts: [
      'Contains an estimated 1.6 million km³ of water ice—comparable to roughly half the volume of the Greenland Ice Sheet.',
      'SHARAD radar sounding reveals alternating bright and dark internal layers recording millions of years of obliquity-driven climate cycles.',
      'Seasonal CO₂ frost condenses from the atmosphere each northern winter and sublimates back in spring.'
    ],
    scientificImportance:
      'Acts as Mars’s primary climate archive, preserving atmospheric dust and orbital tilt cycles in frozen strata.',
    futureExploration:
      'Severe polar winter darkness and extreme seasonal cold (~-143°C) limit human operations compared with mid-latitude plains, though polar ice cores remain a high-value robotic science goal.',
    imageUrl: '/Mars-explored/assets/nasa/polar_caps.jpg',
    imageCaption: 'Planum Boreum layered north polar ice deposits imaged from orbit.',
    imageSourceLabel: 'NASA/JPL PIA10651',
    imageSourceUrl: 'https://images.nasa.gov/details/PIA10651',
    sourceLinks: [
      { label: 'NASA/JPL PIA10651 — North Polar Ice Cap', url: 'https://images.nasa.gov/details/PIA10651' },
      { label: 'MRO SHARAD Science Instruments', url: 'https://science.nasa.gov/mission/mars-reconnaissance-orbiter/science-instruments/' }
    ]
  },
  {
    id: 'south-polar-cap',
    name: 'Planum Australe (South Polar Ice Cap)',
    shortLabel: 'South Polar Cap',
    type: 'Polar layered ice cap',
    markerCategory: 'landmark',
    lat: -85.0,
    lon: 140.0,
    lonEast360: 140.0,
    elevationKm: 3.0,
    elevationNote:
      'Sits high in the southern hemisphere cratered highlands, reaching elevations near +3 km above datum.',
    summary:
      'Mars’s colder southern polar dome, uniquely retaining a perennial residual cap of solid carbon dioxide ice atop thick water-ice layers.',
    geology:
      'First possibly glimpsed by Giovanni Cassini in 1666, Planum Australe hosts ~3.5 km-thick layered water-ice deposits topped by a 1–10 m permanent CO₂ slab and dramatic "Swiss-cheese" sublimation pits.',
    facts: [
      'Because southern winter occurs near aphelion (farthest point from the Sun), southern polar winters are longer and colder than northern winters.',
      'Subsurface radar reflections detected by MARSIS/SHARAD also revealed massive buried CO₂ reservoirs inside the dome.',
      'Springtime CO₂ jets erupt through translucent seasonal ice slabs, depositing dark dust fans.'
    ],
    scientificImportance:
      'Controls Mars’s global seasonal atmospheric pressure cycle as up to 25–30% of the CO₂ atmosphere freezes onto the winter poles.',
    futureExploration:
      'High elevation and extreme cold favor automated climate landers rather than crewed bases.',
    imageUrl: '/Mars-explored/assets/pdf/pdf_img_1.jpg',
    imageCaption: 'Exposed Martian water-ice stratigraphy illustrating layered polar/mid-latitude ice beds (PDF Page 2).',
    imageSourceLabel: 'NASA/JPL PIA22077 / PDF Page 2',
    imageSourceUrl: 'https://images.nasa.gov/details/PIA22077',
    sourceLinks: [
      { label: 'NASA Mars Facts', url: 'https://science.nasa.gov/mars/facts/#h-surface' },
      { label: 'NASA/JPL PIA22077', url: 'https://images.nasa.gov/details/PIA22077' }
    ]
  },
  {
    id: 'hellas-planitia',
    name: 'Hellas Planitia',
    type: 'Giant impact basin',
    markerCategory: 'landmark',
    lat: -42.4,
    lon: 70.5,
    lonEast360: 70.5,
    elevationKm: -7.15,
    elevationNote:
      'Basin floor plunges to -7.15 km (and -8.2 km in localized lows) below the MOLA datum, creating a ~9 km vertical relief from rim to floor.',
    summary:
      'A 2,300-kilometer-wide ancient impact basin in the southern highlands—one of the largest visible impact structures in the solar system.',
    geology:
      'Excavated roughly 3.9–4.1 billion years ago during the Late Heavy Bombardment; subsequently modified by ancient glaciers, lacustrine sediments, and dusty wind-carved plains.',
    facts: [
      'Surface atmospheric pressure at the floor reaches ~11.6 mbar—nearly double the global mean (~6.36 mbar) and above water’s triple-point pressure.',
      'Frequently serves as a source region for regional and planet-encircling dust storms.',
      'Lobate debris aprons along its eastern rim preserve buried glacial water ice.'
    ],
    scientificImportance:
      'Demonstrates how extreme elevation changes alter atmospheric pressure, dust lifting, and ice stability on Mars.',
    futureExploration:
      'Higher air density improves parachute braking during entry, descent, and landing, though frequent dust activity poses solar power challenges.',
    imageUrl: '/Mars-explored/assets/nasa/valles_marineris.jpg',
    imageCaption: 'Martian topographic canyon and highland basin geology from NASA planetary archives.',
    imageSourceLabel: 'NASA Photojournal — Mars Topography',
    imageSourceUrl: 'https://science.nasa.gov/photojournal/mars-topography/',
    sourceLinks: [
      { label: 'NASA Mars Topography (MOLA)', url: 'https://science.nasa.gov/photojournal/mars-topography/' },
      { label: 'USGS Geologic Map of Mars', url: 'https://www.usgs.gov/maps/geologic-map-mars' }
    ]
  },
  {
    id: 'tharsis-ascraeus',
    name: 'Ascraeus Mons (Tharsis Montes)',
    shortLabel: 'Ascraeus Mons',
    type: 'Shield volcano',
    markerCategory: 'landmark',
    lat: 11.9,
    lon: -104.1,
    lonEast360: 255.9,
    elevationKm: 18.2,
    elevationNote:
      'Summit reaches +18.2 km above the Martian datum, making it the tallest of the three aligned Tharsis Montes shield volcanoes.',
    summary:
      'Northernmost and tallest member of the Tharsis Montes volcanic chain—a colossal 1,500 km-long volcanic alignment crossing the Martian equator.',
    geology:
      'Constructed of fluid basaltic pahoehoe-like lava sheets, lava channels, and flank fissure aprons perched on the broad Tharsis volcanic rise.',
    facts: [
      'Its summit stands more than twice the height of Mount Everest above sea level.',
      'Orographic water-ice clouds frequently condense on its western slopes as humid air rises up the Tharsis plateau.',
      'Complex nested calderas span ~60 km across at the summit.'
    ],
    scientificImportance:
      'Clarifies how long-lived volcanic plumes warped Mars’s lithosphere and released volatile gases into the early atmosphere.',
    futureExploration:
      'Valuable orbital target for studying volcanic gas history and orographic cloud microphysics.',
    imageUrl: '/Mars-explored/assets/nasa/olympus_mons.jpg',
    imageCaption: 'Tharsis shield volcano scarp and lava flows imaged by NASA orbiters.',
    imageSourceLabel: 'NASA/JPL PIA03821',
    imageSourceUrl: 'https://images.nasa.gov/details/PIA03821',
    sourceLinks: [
      { label: 'NASA/JPL PIA03821', url: 'https://images.nasa.gov/details/PIA03821' },
      { label: 'USGS Geologic Map of Mars', url: 'https://www.usgs.gov/maps/geologic-map-mars' }
    ]
  },
  {
    id: 'arcadia-planitia',
    name: 'Arcadia Planitia',
    type: 'Northern volcanic plain & ice study zone',
    markerCategory: 'exploration',
    lat: 46.7,
    lon: -172.0,
    lonEast360: 188.0,
    elevationKm: -3.9,
    elevationNote:
      'Low-lying northern plain averaging -3.5 to -4.2 km below the MOLA datum, providing thicker atmosphere for spacecraft deceleration.',
    summary:
      'Primary study region for the 2D Expedition Map—a broad, smooth northern mid-latitude plain where SWIM and SHARAD orbital datasets suggest widespread buried water ice.',
    geology:
      'Amazonian-aged volcanic plains mantled by fine dust, polygonal fracture networks, scalloped depressions, rounded hills with smooth slope aprons, and small ice-exposing craters.',
    facts: [
      'MRO SHARAD radar reflections indicate a subsurface sheet-like dielectric layer consistent with relatively pure water ice beneath shallow overburden.',
      'NASA’s Subsurface Water Ice Mapping (SWIM) project highlights Arcadia Planitia as one of the most accessible mid-latitude ice candidate regions.',
      'Low elevation (-3.9 km) and gentle regional slopes make it an attractive candidate for future crewed landing architectures.'
    ],
    scientificImportance:
      'Central testbed for understanding mid-latitude climate-driven ground ice, thermokarst scalloped depressions, and potential in-situ resource utilization (ISRU).',
    futureExploration:
      'Prime candidate for human and precursor drilling missions, though exact ice depth, purity, boulder hazards, and dust mobility require surface verification.',
    imageUrl: '/Mars-explored/assets/nasa/arcadia_planitia.jpg',
    imageCaption: 'Arcadia Planitia craters and mantled northern plains observed by Mars Reconnaissance Orbiter.',
    imageSourceLabel: 'NASA/JPL PIA26321 & Arcadia Planitia Resource',
    imageSourceUrl: 'https://science.nasa.gov/resource/arcadia-planitia/',
    sourceLinks: [
      { label: 'NASA — Arcadia Planitia', url: 'https://science.nasa.gov/resource/arcadia-planitia/' },
      { label: 'NASA — SWIM Subsurface Water Ice Map', url: 'https://science.nasa.gov/resource/swim-map-shows-subsurface-water-ice-on-mars/' },
      { label: 'PSI SWIM Project', url: 'https://swim.psi.edu/' }
    ],
    featuredStop: true
  },
  {
    id: 'jezero-crater',
    name: 'Jezero Crater',
    shortLabel: 'Jezero Crater',
    stationId: 'perseverance-jezero',
    type: 'Ancient paleolake & river delta',
    markerCategory: 'exploration',
    lat: 18.38,
    lon: 77.58,
    lonEast360: 77.58,
    elevationKm: -2.57,
    elevationNote:
      'Crater floor lies near -2.57 km below the Martian MOLA datum along the western edge of Isidis Planitia.',
    summary:
      'A 45-kilometer-wide impact crater containing a remarkably preserved ancient river delta—active field site of NASA’s Perseverance rover and the Ingenuity helicopter.',
    geology:
      'Once flooded with liquid water roughly 3.5–3.8 billion years ago; inlet channels (Neretva Vallis) deposited fan-delta mudstones, carbonates, and clays ideal for preserving biosignatures.',
    facts: [
      'Perseverance’s MEDA instrument records real-time wind, air/ground temperature, atmospheric pressure, dust, and radiation at Jezero Crater.',
      'Ingenuity completed 72 powered flights in Jezero’s thin atmosphere before retiring in 2024.',
      'Perseverance has cached rock and regolith cores for potential Mars Sample Return.'
    ],
    scientificImportance:
      'Provides direct ground truth of ancient Martian lake chemistry, fluvial sedimentation, and modern local boundary-layer weather via MEDA.',
    futureExploration:
      'Demonstrates autonomous hazard avoidance, MOXIE oxygen production from Martian CO₂, and rotorcraft scouting.',
    imageUrl: '/Mars-explored/assets/nasa/jezero_crater.jpg',
    imageCaption: 'Jezero Crater western fan delta examined by NASA’s Perseverance rover.',
    imageSourceLabel: 'NASA/JPL PIA25022',
    imageSourceUrl: 'https://images.nasa.gov/details/PIA25022',
    sourceLinks: [
      { label: 'Perseverance Science Instruments (MEDA)', url: 'https://science.nasa.gov/mission/mars-2020-perseverance/science-instruments/' },
      { label: 'NASA/JPL PIA25022', url: 'https://images.nasa.gov/details/PIA25022' }
    ]
  },
  {
    id: 'gale-crater',
    name: 'Gale Crater',
    shortLabel: 'Gale Crater',
    stationId: 'curiosity-gale',
    type: 'Impact crater & central mound (Aeolis Mons)',
    markerCategory: 'exploration',
    lat: -5.4,
    lon: 137.8,
    lonEast360: 137.8,
    elevationKm: -4.5,
    elevationNote:
      'Crater floor averages -4.5 km below datum while central Mount Sharp (Aeolis Mons) rises 5.5 km above the crater floor.',
    summary:
      'A 154-kilometer impact basin explored by NASA’s Curiosity rover since August 2012, featuring a 5.5 km-tall layered sedimentary mountain.',
    geology:
      'Basal strata record ancient lakes and streams with neutral pH, clay minerals, and organic carbon compounds, transitioning upward into sulfate-bearing layers reflecting drying climates.',
    facts: [
      'Curiosity’s Radiation Assessment Detector (RAD) measured an average surface radiation dose of roughly 210 microgray/day during its first ~300 sols.',
      'Confirmed Gale Crater once held habitable freshwater lakes persisting for millions of years.',
      'Detected seasonal methane fluctuations and organic molecules in ancient mudstones.'
    ],
    scientificImportance:
      'Established both past habitability on Mars and the first direct surface radiation dosimetry needed to plan astronaut shielding.',
    futureExploration:
      'RAD measurements from Gale Crater serve as a critical historical baseline for human mission radiation risk modeling (though local shielding and solar cycles vary).',
    imageUrl: '/Mars-explored/assets/nasa/gale_crater.jpg',
    imageCaption: 'Mount Sharp (Aeolis Mons) rising from the floor of Gale Crater.',
    imageSourceLabel: 'NASA/JPL PIA15292',
    imageSourceUrl: 'https://images.nasa.gov/details/PIA15292',
    sourceLinks: [
      { label: 'NASA — Radiation Measurements on Mars (RAD)', url: 'https://science.nasa.gov/resource/radiation-measurements-on-mars/' },
      { label: 'NASA/JPL PIA15292', url: 'https://images.nasa.gov/details/PIA15292' }
    ]
  },
  {
    id: 'utopia-planitia',
    name: 'Utopia Planitia',
    shortLabel: 'Utopia Planitia',
    stationId: 'viking2-utopia',
    type: 'Northern lowland impact basin',
    markerCategory: 'exploration',
    lat: 47.97,
    lon: 134.26,
    lonEast360: 134.26,
    elevationKm: -4.4,
    elevationNote:
      'Broad northern basin floor lying around -4.0 to -5.0 km below the MOLA datum.',
    summary:
      'The largest recognized impact basin on Mars (~3,300 km diameter), landing site of Viking 2 (1976) and home to massive buried water-ice sheets.',
    geology:
      'Shows widespread polygonal ground, scalloped thermokarst depressions, and SHARAD-detected underground ice deposits comparable in water volume to Lake Superior.',
    facts: [
      'Viking Lander 2 touched down here in September 1976 and photographed morning water-ice frost on rocks and soil.',
      'SHARAD radar observations revealed a buried ice deposit 80–170 m thick covering an area larger than New Mexico.',
      'Polygonal troughs and scalloped depressions share strong geomorphic parallels with Arcadia Planitia.'
    ],
    scientificImportance:
      'Key comparative analog to Arcadia Planitia for studying northern mid-latitude ground ice and thermal contraction polygons.',
    futureExploration:
      'Strong secondary candidate for mid-latitude water-ice extraction alongside Arcadia Planitia.',
    imageUrl: '/Mars-explored/assets/nasa/utopia_planitia.jpg',
    imageCaption: 'Scalloped and polygonal terrain across Utopia Planitia imaged by MRO HiRISE.',
    imageSourceLabel: 'NASA/JPL PIA17633',
    imageSourceUrl: 'https://www.jpl.nasa.gov/images/pia17633-utopia-planitias-surface/',
    sourceLinks: [
      { label: 'NASA/JPL PIA17633 — Utopia Planitia Surface', url: 'https://www.jpl.nasa.gov/images/pia17633-utopia-planitias-surface/' },
      { label: 'NASA/JPL PIA21138 — Subsurface Water Ice', url: 'https://images.nasa.gov/details/PIA21138' }
    ]
  },
  {
    id: 'chryse-planitia',
    name: 'Chryse Planitia (Viking 1 Site)',
    shortLabel: 'Chryse (Viking 1)',
    stationId: 'viking1-chryse',
    type: 'Outflow plain & historic landing site',
    markerCategory: 'exploration',
    lat: 22.27,
    lon: -47.95,
    lonEast360: 312.05,
    elevationKm: -3.6,
    elevationNote:
      'Smooth northern lowland plain ~3.6 km below the MOLA datum at the mouth of catastrophic outflow channels.',
    summary:
      'Historic 1976 touchdown site of NASA’s Viking 1 Lander—the first spacecraft to operate long-term on the Martian surface.',
    geology:
      'Shaped by catastrophic flood channels draining eastward from Valles Marineris and Lunae Planum, depositing basaltic boulders and windblown drift material.',
    facts: [
      'Viking 1 operated for over six Earth years (2,245 sols), returning the first clear color panoramas from Mars.',
      'Conducted the first biological soil experiments and meteorological recordings on Mars.',
      'Renamed the Thomas A. Mutch Memorial Station after the Viking imaging team leader.'
    ],
    scientificImportance:
      'Established the baseline chemical, meteorological, and geological characterization of Martian regolith.',
    futureExploration:
      'Demonstrates long-duration surface operations and flood-deposited boulder field trafficability challenges.',
    imageUrl: '/Mars-explored/assets/nasa/viking1.jpg',
    imageCaption: 'Martian surface and boulder-strewn plains at Chryse Planitia imaged by Viking Lander 1.',
    imageSourceLabel: 'NASA/JPL PIA00565',
    imageSourceUrl: 'https://images.nasa.gov/details/PIA00565',
    sourceLinks: [
      { label: 'NASA/JPL PIA00565 — Viking Lander 1', url: 'https://images.nasa.gov/details/PIA00565' },
      { label: 'NASA Mars Exploration', url: 'https://science.nasa.gov/mars/' }
    ]
  },
  {
    id: 'elysium-planitia',
    name: 'Elysium Planitia (InSight Site)',
    shortLabel: 'Elysium (InSight)',
    stationId: 'insight-elysium',
    type: 'Equatorial volcanic plain & geophysical station',
    markerCategory: 'exploration',
    lat: 4.5,
    lon: 135.62,
    lonEast360: 135.62,
    elevationKm: -2.66,
    elevationNote:
      'Smooth equatorial plain near -2.66 km below the MOLA datum, south of the Elysium Mons volcanic rise.',
    summary:
      'Landing site of NASA’s InSight lander (2018–2022), which measured Mars’s deep interior structure using a ultra-sensitive seismometer.',
    geology:
      'Flat basaltic lava plains covered by a regolith layer a few meters thick, fractured by nearby Cerberus Fossae tectonic faults.',
    facts: [
      'InSight’s SEIS seismometer detected over 1,300 marsquakes, revealing the thickness of Mars’s crust and size of its liquid core.',
      'Confirmed that Mars remains seismically active, especially along Cerberus Fossae.',
      'Dust accumulation on solar panels eventually ended mission operations in December 2022.'
    ],
    scientificImportance:
      'Provided the first direct seismic measurements of Mars’s core, mantle, and crustal layering.',
    futureExploration:
      'Demonstrated both seismic hazard awareness and the impact of fine atmospheric dust settling on solar power systems.',
    imageUrl: '/Mars-explored/assets/nasa/insight.jpg',
    imageCaption: 'InSight’s SEIS seismometer deployed on the regolith of Elysium Planitia.',
    imageSourceLabel: 'NASA/JPL PIA22956',
    imageSourceUrl: 'https://images.nasa.gov/details/PIA22956',
    sourceLinks: [
      { label: 'NASA/JPL PIA22956 — InSight SEIS', url: 'https://images.nasa.gov/details/PIA22956' },
      { label: 'NASA Mars Facts', url: 'https://science.nasa.gov/mars/facts/#h-surface' }
    ]
  },
  {
    id: 'gusev-crater',
    name: 'Gusev Crater (Spirit Site)',
    shortLabel: 'Gusev (Spirit)',
    type: 'Ancient crater & Columbia Hills',
    markerCategory: 'exploration',
    lat: -14.57,
    lon: 175.47,
    lonEast360: 175.47,
    elevationKm: -1.9,
    elevationNote:
      'Crater basin floor near -1.9 km below the Martian MOLA datum, bisected by the Ma’adim Vallis channel.',
    summary:
      'A 166-kilometer crater explored by NASA’s Spirit rover from 2004 to 2010, revealing volcanic plains and hydrothermal silica deposits.',
    geology:
      'Although initially thought to be a lakebed, Spirit found basaltic lava flows on the plains before discovering water-altered carbonate and nearly pure silica deposits in the Columbia Hills.',
    facts: [
      'Spirit climbed Husband Hill and operated for 2,208 sols—more than 20 times its 90-sol prime mission.',
      'Discovered Home Plate, an eroded ancient hydrothermal volcanic deposit indicating hot-spring activity.',
      'Passing dust devils periodically cleaned Spirit’s solar arrays, extending its operational life.'
    ],
    scientificImportance:
      'Demonstrated ancient hydrothermal environments capable of supporting microbial energy gradients.',
    futureExploration:
      'Valuable engineering benchmark for wheeled rover mobility across loose sulfate sand traps.',
    imageUrl: '/Mars-explored/assets/nasa/spirit.jpg',
    imageCaption: 'Mars Exploration Rover Spirit surveying Gusev Crater terrain.',
    imageSourceLabel: 'NASA/JPL PIA05040',
    imageSourceUrl: 'https://images.nasa.gov/details/PIA05040',
    sourceLinks: [
      { label: 'NASA/JPL PIA05040 — Spirit Rover', url: 'https://images.nasa.gov/details/PIA05040' }
    ]
  },
  {
    id: 'meridiani-planum',
    name: 'Meridiani Planum (Opportunity Site)',
    shortLabel: 'Meridiani (Opportunity)',
    stationId: 'opportunity-meridiani',
    type: 'Hematite-rich equatorial plain',
    markerCategory: 'exploration',
    lat: -1.95,
    lon: -5.53,
    lonEast360: 354.47,
    elevationKm: -1.4,
    elevationNote:
      'Equatorial layered plains averaging -1.4 km below the MOLA datum near the Martian prime meridian.',
    summary:
      'Equatorial plain explored by NASA’s Opportunity rover across a record-breaking 45.16 km traverse from Eagle Crater to Endeavour Crater.',
    geology:
      'Rich in gray crystalline hematite spherules ("blueberries") and cross-bedded sulfate sandstones formed by episodic ancient groundwater.',
    facts: [
      'Opportunity operated for nearly 15 Earth years (5,111 sols) before a 2018 global dust storm ended contact.',
      'Confirmed acidic ancient groundwater and ephemeral surface water puddles at Eagle, Endurance, Victoria, and Endeavour craters.',
      'Traversed 45.16 km, proving multi-decade robotic durability on Mars.'
    ],
    scientificImportance:
      'Provided mineralogical proof of ancient groundwater activity in equatorial Mars.',
    futureExploration:
      'Highlights the operational impact of planet-encircling dust storms on solar-powered surface assets.',
    imageUrl: '/Mars-explored/assets/nasa/opportunity.jpg',
    imageCaption: 'Opportunity rover vista across Meridiani Planum crater deposits.',
    imageSourceLabel: 'NASA/JPL PIA16559',
    imageSourceUrl: 'https://images.nasa.gov/details/PIA16559',
    sourceLinks: [
      { label: 'NASA/JPL PIA16559 — Opportunity', url: 'https://images.nasa.gov/details/PIA16559' }
    ]
  }
];

export function findMatchingMarsLocation(
  lat: number,
  lonDeg: number,
  maxDeg = 5.5
): MarsLocation | null {
  const normLon = ((lonDeg % 360) + 360) % 360;
  let best: MarsLocation | null = null;
  let bestDist = Infinity;
  for (const loc of MARS_LOCATIONS) {
    let dLon = Math.abs(normLon - loc.lonEast360);
    if (dLon > 180) dLon = 360 - dLon;
    const dLat = Math.abs(lat - loc.lat);
    const dist = Math.hypot(dLat, dLon);
    if (dist <= maxDeg && dist < bestDist) {
      bestDist = dist;
      best = loc;
    }
  }
  return best;
}
