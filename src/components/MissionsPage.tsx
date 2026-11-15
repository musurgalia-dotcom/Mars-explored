import { useMemo, useState } from 'react';
import { ExternalLink, X, Filter, Satellite } from 'lucide-react';
import {
  MarsMission,
  NASA_MISSIONS,
  SCIENTIFIC_INSTRUMENTS
} from '../data/missionsData';

type MissionFilter =
  | 'All missions'
  | 'Orbiters'
  | 'Landers'
  | 'Rovers'
  | 'Atmospheric research'
  | 'Surface exploration'
  | 'Active missions'
  | 'Historical missions';

const FILTER_OPTIONS: MissionFilter[] = [
  'All missions',
  'Orbiters',
  'Landers',
  'Rovers',
  'Atmospheric research',
  'Surface exploration',
  'Active missions',
  'Historical missions'
];

export default function MissionsPage() {
  const [activeFilter, setActiveFilter] = useState<MissionFilter>('All missions');
  const [selectedMission, setSelectedMission] = useState<MarsMission | null>(null);

  const filteredMissions = useMemo(() => {
    return NASA_MISSIONS.filter((m) => {
      switch (activeFilter) {
        case 'Orbiters':
          return m.type === 'Orbiter';
        case 'Landers':
          return m.type === 'Lander';
        case 'Rovers':
          return m.type === 'Rover';
        case 'Atmospheric research':
          return m.researchFocus.includes('Atmospheric research');
        case 'Surface exploration':
          return m.researchFocus.includes('Surface exploration');
        case 'Active missions':
          return m.status === 'Active';
        case 'Historical missions':
          return m.status === 'Historical';
        default:
          return true;
      }
    });
  }, [activeFilter]);

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 space-y-14">
      {/* Header */}
      <div className="border-b border-white/10 pb-6 space-y-2 max-w-3xl">
        <div className="text-xs font-mono text-[#F4845F]">
          NASA / JPL / Langley / GSFC Planetary Fleet
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
          NASA Mars Missions &amp; Scientific Instruments
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          Explore the robotic orbiters, landers, and rovers that mapped Mars, characterized its
          atmosphere, and supplied the imagery, radar, altimetry, and environmental benchmarks used
          across this platform.
        </p>
      </div>

      {/* Mission Filters */}
      <section className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <Filter className="h-3.5 w-3.5 text-[#E05A2B]" />
            <span>
              Showing <strong className="text-white tabular-nums">{filteredMissions.length}</strong> of{' '}
              <span className="tabular-nums">{NASA_MISSIONS.length}</span> missions
            </span>
          </div>

          <div
            role="tablist"
            aria-label="Filter NASA Mars missions"
            className="flex flex-wrap items-center gap-1.5"
          >
            {FILTER_OPTIONS.map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#E05A2B] text-white'
                      : 'border border-white/10 bg-[#111622] text-slate-300 hover:bg-[#192032] hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mission Gallery Grid: 2 cards per row on desktop, 1 on mobile, equal dimensions */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {filteredMissions.map((mission) => (
            <article
              key={mission.id}
              className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0D111A] hover:border-white/25 transition-colors"
            >
              <button
                type="button"
                onClick={() => setSelectedMission(mission)}
                className="group relative aspect-[16/9] w-full overflow-hidden bg-[#121723] text-left cursor-pointer"
              >
                <img
                  src={mission.imageUrl}
                  alt={mission.name}
                  className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0D111A] via-[#0D111A]/50 to-transparent" />
              </button>

              <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                <div className="space-y-2.5">
                  {/* Unboxed clean typographic metadata */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                    <span className="font-medium text-slate-200">{mission.organization}</span>
                    <span aria-hidden="true">·</span>
                    <span>{mission.type}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">Launched {mission.launchYear}</span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        mission.status === 'Active' ? 'text-emerald-400 font-medium' : 'text-slate-400'
                      }
                    >
                      {mission.status}
                    </span>
                  </div>

                  <h2 className="font-display text-xl font-bold text-white">
                    <button
                      type="button"
                      onClick={() => setSelectedMission(mission)}
                      className="text-left hover:text-[#F4845F] transition-colors cursor-pointer"
                    >
                      {mission.name}
                    </button>
                  </h2>

                  <p className="text-sm text-slate-300 leading-relaxed">
                    {mission.shortDescription}
                  </p>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    <strong className="text-slate-200 font-medium">Primary objective:</strong>{' '}
                    {mission.mainObjective}
                  </p>
                </div>

                <div className="space-y-3 border-t border-white/10 pt-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedMission(mission)}
                      className="rounded-md bg-[#161D2E] border border-white/12 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#1F2940] transition-colors cursor-pointer"
                    >
                      Inspect Mission Details
                    </button>
                    <a
                      href={mission.officialMissionUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#F4845F] hover:underline"
                    >
                      <span>Official NASA Mission Page</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  {/* Image source attribution */}
                  <div className="text-[11px] text-slate-400">
                    Image credit:{' '}
                    <a
                      href={mission.imageSourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-300 hover:text-white underline"
                    >
                      {mission.imageCredit}
                    </a>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Scientific Instruments Behind the Expedition Map */}
      <section className="space-y-5 border-t border-white/10 pt-10">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-sky-400">
            <Satellite className="h-3.5 w-3.5" />
            <span>Orbital &amp; Surface Instrumentation</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-white">
            Missions &amp; Instruments Behind the Expedition Map
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Each scientific instrument observes Mars in a fundamentally different physical regime.
            These instruments are <strong className="text-white">not interchangeable</strong>:
            optical cameras cannot sound buried ice, radar cannot photograph boulders, and surface
            weather or radiation stations only measure conditions at their specific landing sites
            (Jezero Crater and Gale Crater—not Arcadia Planitia).
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0D111A]">
          <table className="w-full min-w-[780px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-[#121723] text-xs font-semibold text-slate-300">
                <th className="px-4 py-3">Mission / Instrument</th>
                <th className="px-4 py-3">What It Measures</th>
                <th className="px-4 py-3">Expedition Value</th>
                <th className="px-4 py-3">Scope &amp; Distinction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8 text-xs text-slate-300">
              {SCIENTIFIC_INSTRUMENTS.map((row) => (
                <tr key={row.instrument} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3.5 font-semibold text-white whitespace-nowrap">
                    <a
                      href={row.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 hover:text-[#F4845F]"
                    >
                      <span>{row.instrument}</span>
                      <ExternalLink className="h-3 w-3 text-slate-400" />
                    </a>
                  </td>
                  <td className="px-4 py-3.5 leading-relaxed">{row.measures}</td>
                  <td className="px-4 py-3.5 leading-relaxed">{row.expeditionValue}</td>
                  <td className="px-4 py-3.5 text-slate-400 leading-relaxed">
                    {row.nonInterchangeabilityNote}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Mission Detail Modal */}
      {selectedMission && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selectedMission.name}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-white/15 bg-[#0D111A] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-[#0D111A] px-6 py-4">
              <div>
                <div className="text-xs text-slate-400">
                  {selectedMission.organization} · {selectedMission.type} ·{' '}
                  {selectedMission.status}
                </div>
                <h2 className="font-display text-xl font-bold text-white mt-0.5">
                  {selectedMission.name}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close mission details"
                onClick={() => setSelectedMission(null)}
                className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-sm">
              <figure className="space-y-1.5">
                <div className="overflow-hidden rounded-lg border border-white/10 aspect-[16/9] bg-[#121723]">
                  <img
                    src={selectedMission.imageUrl}
                    alt={selectedMission.name}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <figcaption className="text-xs text-slate-400">
                  {selectedMission.imageCaption} ·{' '}
                  <a
                    href={selectedMission.imageSourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#F4845F] hover:underline"
                  >
                    {selectedMission.imageCredit}
                  </a>
                </figcaption>
              </figure>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-lg border border-white/10 bg-[#121723] p-3.5 text-xs">
                <div>
                  <div className="text-slate-400">Launch Year</div>
                  <div className="font-mono font-semibold text-white tabular-nums mt-0.5">
                    {selectedMission.launchYear}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Operations</div>
                  <div className="font-medium text-white mt-0.5">
                    {selectedMission.operationalPeriod}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Site / Orbit</div>
                  <div className="font-medium text-white mt-0.5">
                    {selectedMission.landingOrOrbitSite}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-display text-sm font-semibold text-white mb-1">
                  Mission Overview
                </h3>
                <p className="text-slate-300 leading-relaxed">{selectedMission.shortDescription}</p>
              </div>

              <div>
                <h3 className="font-display text-sm font-semibold text-white mb-1">
                  Main Objective
                </h3>
                <p className="text-slate-300 leading-relaxed">{selectedMission.mainObjective}</p>
              </div>

              <div>
                <h3 className="font-display text-sm font-semibold text-white mb-1">
                  Scientific Contributions
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  {selectedMission.scientificContributions}
                </p>
              </div>

              <div>
                <h3 className="font-display text-sm font-semibold text-white mb-1.5">
                  Key Instruments
                </h3>
                <div className="text-xs font-mono text-slate-300">
                  {selectedMission.keyInstruments.join(' · ')}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                <a
                  href={selectedMission.officialMissionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#E05A2B] px-4 py-2 text-xs font-semibold text-white hover:bg-[#c94c21]"
                >
                  <span>Visit Official NASA Page</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <a
                  href={selectedMission.imageSourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white underline"
                >
                  <span>Original Image Archive</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
