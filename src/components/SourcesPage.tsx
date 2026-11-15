import { ExternalLink, BookOpen, Database, Image as ImageIcon } from 'lucide-react';
import { DATASET_ATTRIBUTIONS, REFERENCES_LIST } from '../data/sourcesData';
import { NASA_MISSIONS } from '../data/missionsData';
import { MARS_LOCATIONS } from '../data/marsLocations';

export default function SourcesPage() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 space-y-14">
      <header className="border-b border-white/10 pb-6 max-w-3xl space-y-2">
        <div className="text-xs font-mono text-[#F4845F]">
          Scientific Bibliography &amp; Data Provenance
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
          Sources &amp; Scientific References
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          All planetary datasets, mission images, topographic baselines, and bibliographic
          references [1]–[31] preserved from the original research document and verified NASA/JPL
          and USGS archives.
        </p>
      </header>

      {/* Map Datasets & Planetary Imagery Attributions */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-sky-400" />
          <h2 className="font-display text-2xl font-bold text-white">
            Planetary Map Datasets &amp; 3D Globe Textures
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {DATASET_ATTRIBUTIONS.map((ds) => (
            <div
              key={ds.dataset}
              className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#0D111A] p-5 space-y-3"
            >
              <div className="space-y-1.5">
                <div className="text-xs font-mono text-sky-400">{ds.provider}</div>
                <h3 className="font-display text-base font-bold text-white">{ds.dataset}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{ds.usage}</p>
              </div>
              <a
                href={ds.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-[#F4845F] hover:underline"
              >
                <span>Open Official Dataset Resource</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Complete Numbered Bibliography [1]–[31] */}
      <section className="space-y-4 border-t border-white/10 pt-10">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[#F4845F]" />
          <h2 className="font-display text-2xl font-bold text-white">
            Numbered Scientific References [1]–[31]
          </h2>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0D111A] divide-y divide-white/8">
          {REFERENCES_LIST.map((ref) => (
            <div
              key={ref.number}
              className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 px-5 py-3.5 text-sm"
            >
              <span className="font-mono text-xs font-bold text-[#F4845F] tabular-nums shrink-0 w-9">
                [{ref.number}]
              </span>
              <div className="space-y-1 min-w-0">
                <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">{ref.citation}</p>
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-mono text-sky-400 hover:underline break-all"
                >
                  <span>{ref.url}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Image Source Attribution Index */}
      <section className="space-y-4 border-t border-white/10 pt-10 pb-8">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-emerald-400" />
          <h2 className="font-display text-2xl font-bold text-white">
            Image Archive Attributions
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-[#0D111A] p-5 space-y-3">
            <h3 className="font-display text-base font-bold text-white">
              NASA Missions Gallery Images
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {NASA_MISSIONS.map((m) => (
                <li key={m.id} className="flex items-baseline justify-between gap-2">
                  <span className="font-medium text-slate-200">{m.name}</span>
                  <a
                    href={m.imageSourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#F4845F] hover:underline shrink-0"
                  >
                    <span>{m.imageCredit}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0D111A] p-5 space-y-3">
            <h3 className="font-display text-base font-bold text-white">
              Planetary Locations &amp; PDF Visuals
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {MARS_LOCATIONS.slice(0, 11).map((loc) => (
                <li key={loc.id} className="flex items-baseline justify-between gap-2">
                  <span className="font-medium text-slate-200">{loc.name}</span>
                  <a
                    href={loc.imageSourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#F4845F] hover:underline shrink-0"
                  >
                    <span>{loc.imageSourceLabel}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
