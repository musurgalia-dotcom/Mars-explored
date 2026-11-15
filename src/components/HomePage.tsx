import { ArrowRight, Compass, Layers, Rocket, ShieldAlert, Microscope, MapPin } from 'lucide-react';
import MarsGlobe3D from './MarsGlobe3D';
import { PageId } from './Navbar';

interface HomePageProps {
  onNavigate: (page: PageId, locationId?: string) => void;
}

const FEATURED_LOCATIONS = [
  {
    id: 'olympus-mons',
    name: 'Olympus Mons',
    metric: '+21.9 km MOLA Datum',
    summary: 'Largest shield volcano in the solar system, spanning ~600 km across the Tharsis volcanic rise.',
    image: '/assets/pdf/pdf_img_3.jpg'
  },
  {
    id: 'valles-marineris',
    name: 'Valles Marineris',
    metric: '4,000 km Rift System',
    summary: 'Equatorial tectonic canyon system dropping 7 km deep into layered Martian crust.',
    image: '/assets/pdf/pdf_img_2.jpg'
  },
  {
    id: 'jezero-crater',
    name: 'Jezero Crater',
    metric: 'Perseverance & MEDA Site',
    summary: 'Ancient lakebed and river delta preserving clays, carbonates, and modern weather measurements.',
    image: '/assets/nasa/jezero_crater.jpg'
  },
  {
    id: 'gale-crater',
    name: 'Gale Crater',
    metric: 'Curiosity & RAD Site',
    summary: '154 km impact basin with Mount Sharp and surface radiation measurements from RAD.',
    image: '/assets/nasa/gale_crater.jpg'
  }
];

export default function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section with Genuine Interactive 3D Mars Globe */}
      <section className="mx-auto max-w-[1440px] px-4 pt-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-center">
          <div className="lg:col-span-5 space-y-5">
            <div className="text-xs font-mono text-[#F4845F]">
              NASA / JPL &amp; USGS Planetary Exploration Interface
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.12]">
              Explore Mars Through Orbital Science &amp; Expedition Mapping
            </h1>
            <p className="text-base text-slate-300 leading-relaxed max-w-xl">
              Investigate Martian geography on a coherent 3D planetary globe, plan an astronaut
              surface traverse in Arcadia Planitia using real NASA datasets, and examine Mars
              mission archives, planetary science, and surface safety conditions.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onNavigate('globe')}
                className="inline-flex items-center gap-2 rounded-md bg-[#E05A2B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#c94c21] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Compass className="h-4 w-4" />
                <span>Explore 3D Mars Globe</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('map')}
                className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-[#121723] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1B2234] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Layers className="h-4 w-4 text-[#F4845F]" />
                <span>Open 2D Expedition Map</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-5 text-xs">
              <div>
                <div className="text-slate-400">Mean Radius</div>
                <div className="font-mono text-base font-semibold text-white tabular-nums mt-0.5">
                  3,389.5 km
                </div>
              </div>
              <div>
                <div className="text-slate-400">Martian Sol</div>
                <div className="font-mono text-base font-semibold text-white tabular-nums mt-0.5">
                  24.6 hours
                </div>
              </div>
              <div>
                <div className="text-slate-400">Study Region</div>
                <div className="font-mono text-base font-semibold text-sky-400 tabular-nums mt-0.5">
                  Arcadia 46.7°N
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <MarsGlobe3D
              mode="hero"
              onNavigateTo2DMap={() => onNavigate('map')}
              onNavigateToExplorer={(locId) => onNavigate('globe', locId)}
            />
          </div>
        </div>
      </section>

      {/* Platform Preview Grid: Explore Mars & Arcadia Planitia Expedition */}
      <section className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">
              Planetary Navigation &amp; Expedition Planning
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Built directly on NASA Mars Trek mosaics, MOLA altimetry, MRO orbital strips, and SWIM ice mapping.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Explore Mars */}
          <article className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0D111A]">
            <div className="aspect-[16/10] overflow-hidden bg-[#121723]">
              <img
                src="/assets/nasa/olympus_mons.jpg"
                alt="Olympus Mons scarp on Mars"
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
              <div className="space-y-2">
                <div className="text-xs font-mono text-[#F4845F]">3D Planetary Explorer</div>
                <h3 className="font-display text-lg font-bold text-white">Explore Mars</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Rotate the full Martian globe with attached coordinate grids, surface relief, and
                  14 verified red landmark and green landing-site markers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('globe')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#F4845F] hover:text-white transition-colors cursor-pointer"
              >
                <span>Launch 3D Explorer</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </article>

          {/* Arcadia Planitia Expedition */}
          <article className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0D111A]">
            <div className="aspect-[16/10] overflow-hidden bg-[#121723]">
              <img
                src="/assets/nasa/arcadia_planitia.jpg"
                alt="Arcadia Planitia surface craters and plains"
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
              <div className="space-y-2">
                <div className="text-xs font-mono text-sky-400">46.7°N, 188.0°E · Northern Plains</div>
                <h3 className="font-display text-lg font-bold text-white">
                  Arcadia Planitia Expedition
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Analyze potential subsurface ice layers, MOLA topography, boulder hazards,
                  four scientific stops, and A* terrain-aware rover routes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('map')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-400 hover:text-white transition-colors cursor-pointer"
              >
                <span>Open 2D Expedition Map</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </article>

          {/* NASA Missions */}
          <article className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0D111A]">
            <div className="aspect-[16/10] overflow-hidden bg-[#121723]">
              <img
                src="/assets/nasa/perseverance.jpg"
                alt="Perseverance rover and Ingenuity helicopter on Mars"
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
              <div className="space-y-2">
                <div className="text-xs font-mono text-emerald-400">1975 — Present</div>
                <h3 className="font-display text-lg font-bold text-white">NASA Missions</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Browse active and historical orbiters, landers, and rovers from Viking 1 to
                  Perseverance, plus the orbital instruments behind our maps.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('missions')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-white transition-colors cursor-pointer"
              >
                <Rocket className="h-4 w-4" />
                <span>View Mission Gallery</span>
              </button>
            </div>
          </article>
        </div>
      </section>

      {/* Important Martian Locations */}
      <section className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">
              Important Martian Locations
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Select any landmark or landing basin to focus directly on it inside the 3D Mars globe.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('globe')}
            className="text-xs font-semibold text-[#F4845F] hover:underline cursor-pointer self-start sm:self-auto"
          >
            View all 14 mapped locations
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_LOCATIONS.map((loc) => (
            <button
              key={loc.id}
              type="button"
              onClick={() => onNavigate('globe', loc.id)}
              className="group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0D111A] text-left hover:border-[#E05A2B]/60 transition-colors cursor-pointer"
            >
              <div className="aspect-[16/10] w-full overflow-hidden bg-[#121723]">
                <img
                  src={loc.image}
                  alt={loc.name}
                  className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-4 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>{loc.metric}</span>
                  <MapPin className="h-3.5 w-3.5 text-[#E05A2B]" />
                </div>
                <h3 className="font-display text-base font-bold text-white">{loc.name}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{loc.summary}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Scientific Discoveries & Astronaut Safety Split */}
      <section className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-stretch">
          {/* Scientific Discoveries */}
          <article className="flex flex-col sm:flex-row overflow-hidden rounded-xl border border-white/10 bg-[#0D111A]">
            <div className="sm:w-2/5 aspect-[4/3] sm:aspect-auto overflow-hidden bg-[#121723]">
              <img
                src="/assets/pdf/pdf_img_1.jpg"
                alt="Exposed underground water ice sheet on Mars (PDF Page 2)"
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="sm:w-3/5 p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 text-xs font-mono text-sky-400">
                  <Microscope className="h-3.5 w-3.5" />
                  <span>Scientific Discoveries</span>
                </div>
                <h3 className="font-display text-xl font-bold text-white">
                  Subsurface Water Ice &amp; Ancient Habitability
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  NASA orbiters and rovers show Mars was once warmer and wetter, while SHARAD radar
                  and HiRISE scarp images reveal thick mid-latitude water-ice deposits preserved
                  beneath protective dusty regolith.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('about')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-400 hover:text-white cursor-pointer"
              >
                <span>Read About Mars &amp; Biomes</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </article>

          {/* Astronaut Safety */}
          <article className="flex flex-col sm:flex-row overflow-hidden rounded-xl border border-white/10 bg-[#0D111A]">
            <div className="sm:w-2/5 aspect-[4/3] sm:aspect-auto overflow-hidden bg-[#121723]">
              <img
                src="/assets/pdf/pdf_img_4.jpg"
                alt="Future astronaut and pressurized rover on Mars (PDF Page 5)"
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="sm:w-3/5 p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-400">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Astronaut Safety</span>
                </div>
                <h3 className="font-display text-xl font-bold text-white">
                  Thin CO₂ Air, Dust Storms &amp; Surface Radiation
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  With ~6.36 mbar mean pressure, ~95% CO₂ atmosphere, extreme diurnal thermal
                  swings, and cosmic radiation measured by Curiosity’s RAD, human Marswalks require
                  rigorous suit, habitat, and route verification.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('about')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-400 hover:text-white cursor-pointer"
              >
                <span>Explore Environmental Safety &amp; Checklist</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
