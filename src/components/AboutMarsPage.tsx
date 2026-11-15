import { useState } from 'react';
import { CheckSquare, Square, RotateCcw, ExternalLink, ShieldAlert } from 'lucide-react';
import {
  ENVIRONMENTAL_CONDITIONS,
  MARSWALK_CHECKLIST,
  MARTIAN_SEASONS,
  PDF_BIOMES,
  PDF_FUTURE_EXPLORATION_IMAGE
} from '../data/aboutMarsData';

export default function AboutMarsPage() {
  const [checkedIds, setCheckedIds] = useState<string[]>([
    'wind',
    'temp',
    'radiation'
  ]);

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 space-y-14">
      {/* Page Title */}
      <header className="border-b border-white/10 pb-6 max-w-3xl space-y-2">
        <div className="text-xs font-mono text-[#F4845F]">
          Planetary Overview &amp; Astronaut Environmental Reference
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
          About Mars &amp; Surface Safety Conditions
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          Scientific facts, historical observations, seasons, moons, Martian biomes from the
          original project document, and environmental conditions that shape future human exploration.
        </p>
      </header>

      {/* 12.1–12.3 General Information, History, and Geology */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-3">
            <h2 className="font-display text-2xl font-bold text-white">
              01. General Information &amp; Formation
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Mars—the fourth planet from the Sun—is a dusty, cold, desert world with a very thin
              atmosphere [1]. When the solar system settled into its current layout about 4.5 billion
              years ago, Mars formed when gravity pulled swirling gas and dust together. Roughly
              half the size of Earth, Mars is a terrestrial planet composed of a central core, a
              rocky mantle, and a solid crust [1].
            </p>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Mars is one of the most thoroughly explored bodies in the solar system and the only
              planet where humanity has sent robotic rovers to traverse the landscape. NASA missions
              have uncovered extensive evidence that Mars was once much wetter and warmer, with a
              thicker atmosphere billions of years ago [1].
            </p>
          </div>

          <div className="space-y-3 border-t border-white/10 pt-6">
            <h2 className="font-display text-2xl font-bold text-white">
              02. History of Observation
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Humanity has observed Mars since prehistoric times. Key telescopic milestones recorded
              in the project reference material include:
            </p>
            <ul className="space-y-2.5 text-sm text-slate-300 list-disc pl-5">
              <li>
                <strong className="text-white">1610 — Galileo Galilei:</strong> Became the first
                person to observe Mars through a telescope.
              </li>
              <li>
                <strong className="text-white">November 28, 1659 — Christiaan Huygens:</strong>{' '}
                Created the first map and detailed drawings of Mars’s surface, depicting prominent
                dark albedo regions.
              </li>
              <li>
                <strong className="text-white">1666 — Giovanni Cassini:</strong> Probably the first
                astronomer to notice the bright ice cap at Mars’s south pole.
              </li>
            </ul>
          </div>

          <div className="space-y-3 border-t border-white/10 pt-6">
            <h2 className="font-display text-2xl font-bold text-white">
              03. Surface, Geology &amp; Why Mars Is Red
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Mars is a dynamic terrestrial world whose surface combines impact craters reminiscent
              of the Moon with volcanoes, deserts, valleys, canyons, and polar ice caps similar to
              Earth [2][1].
            </p>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Ancient Romans named the planet after their god of war because its reddish color
              resembled blood, while ancient Egyptians called it <em>“Her Desher”</em>, meaning
              “the red one.” Today it is known as the Red Planet because iron minerals in the
              Martian soil oxidize—or rust—causing the dusty surface and suspended atmospheric haze
              to appear red [1].
            </p>
          </div>
        </div>

        {/* Side Summary Metrics Card */}
        <aside className="lg:col-span-5 rounded-xl border border-white/10 bg-[#0D111A] p-6 space-y-5">
          <h3 className="font-display text-lg font-bold text-white">
            04. Rotation, Orbit &amp; Moons
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border border-white/10 bg-[#121723] p-3">
              <div className="text-slate-400">Martian Sol (Day)</div>
              <div className="font-mono text-lg font-bold text-white tabular-nums mt-0.5">
                24.6 hours
              </div>
              <div className="text-slate-400 mt-0.5">Earth day: 23.9 hours</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#121723] p-3">
              <div className="text-slate-400">Martian Year</div>
              <div className="font-mono text-lg font-bold text-white tabular-nums mt-0.5">
                669.6 sols
              </div>
              <div className="text-slate-400 mt-0.5">Equals 687 Earth days</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#121723] p-3">
              <div className="text-slate-400">Axial Tilt</div>
              <div className="font-mono text-lg font-bold text-white tabular-nums mt-0.5">
                25.0°
              </div>
              <div className="text-slate-400 mt-0.5">Earth tilt: 23.4°</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#121723] p-3">
              <div className="text-slate-400">Natural Satellites</div>
              <div className="font-mono text-lg font-bold text-white tabular-nums mt-0.5">
                2 Moons
              </div>
              <div className="text-slate-400 mt-0.5">Phobos &amp; Deimos</div>
            </div>
          </div>

          <div className="space-y-2 border-t border-white/10 pt-4 text-sm text-slate-300 leading-relaxed">
            <h4 className="font-display text-sm font-bold text-white">
              Phobos &amp; Deimos (Discovered August 1877)
            </h4>
            <p className="text-xs leading-relaxed">
              Discovered in August 1877 by astronomer Asaph Hall and named after the twin sons of
              Ares in Greek mythology—<em>Phobos</em> (“fear”) and <em>Deimos</em> (“terror”) [1][2].
              Both moons are irregular, potato-shaped bodies because they possess too little mass
              for self-gravity to pull them into spheres. Scientists consider it likely they were
              former asteroids captured by Mars’s gravitational field [1][2].
            </p>
          </div>
        </aside>
      </section>

      {/* 12.5 Seasons & 12.7 Temperature/Atmosphere */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-[#0D111A] p-6 space-y-4">
          <h2 className="font-display text-xl font-bold text-white">
            05. Martian Seasons (Measured in Sols)
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Because Mars has an axial tilt of 25° (similar to Earth’s 23.4°), it experiences four
            distinct seasons. However, Mars’s year is longer (669.6 sols / 687 Earth days) and its
            orbit around the Sun is noticeably elliptical (“egg-shaped”), causing seasons to vary
            markedly in length rather than lasting equal quarters [1]:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="py-2 pr-3">Northern Hemisphere</th>
                  <th className="py-2 pr-3">Southern Hemisphere</th>
                  <th className="py-2 pr-3">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8 text-slate-200">
                {MARTIAN_SEASONS.map((s) => (
                  <tr key={s.northernSeason}>
                    <td className="py-2.5 pr-3 font-medium">{s.northernSeason}</td>
                    <td className="py-2.5 pr-3 text-slate-300">{s.southernSeason}</td>
                    <td className="py-2.5 pr-3 font-mono font-semibold text-[#F4845F] tabular-nums">
                      {s.durationSols} sols
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Note: 1 sol = ~24.6 hours (one Martian solar day). The source PDF text refers to 142
            sols as “142 days” in that sentence; Martian seasonal durations above are expressed
            consistently in sols [1].
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0D111A] p-6 space-y-4">
          <h2 className="font-display text-xl font-bold text-white">
            06. Temperature Extremes &amp; Thin Atmosphere
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Because Mars’s atmosphere (~95% carbon dioxide, mean pressure ~6.36 mbar) is so thin,
            solar heat escapes rapidly into space [1][26]. No single average temperature represents
            every Martian location or time of day:
          </p>
          <ul className="space-y-2.5 text-sm text-slate-300 list-disc pl-5">
            <li>
              <strong className="text-white">Global range:</strong> Temperatures reach as high as
              about <span className="font-mono tabular-nums text-white">20°C (70°F)</span> at
              equatorial noon and drop as low as{' '}
              <span className="font-mono tabular-nums text-white">−153°C (−225°F)</span> near the
              poles, with a global mean around <span className="font-mono tabular-nums">214 K (−59°C)</span> [1][26].
            </li>
            <li>
              <strong className="text-white">Steep vertical gradient:</strong> Standing on the
              equator at noon, your feet would feel like spring (
              <span className="font-mono tabular-nums">24°C / 75°F</span>) while the thin air at
              your head felt like winter (<span className="font-mono tabular-nums">0°C / 32°F</span>) [1].
            </li>
            <li>
              <strong className="text-white">Global dust storms:</strong> Martian winds occasionally
              whip up dust storms capable of shrouding much of the planet; afterward, it can take
              months before all airborne dust settles [1].
            </li>
          </ul>
        </div>
      </section>

      {/* 12.9 & 13 Surface Biomes & Regions from Attached PDF */}
      <section className="space-y-6 border-t border-white/10 pt-10">
        <div className="max-w-3xl space-y-2">
          <div className="text-xs font-mono text-[#F4845F]">
            Visual Material from Original Project PDF (nasaais_c5566504.pdf)
          </div>
          <h2 className="font-display text-2xl font-bold text-white">
            07. Martian Surface Biomes &amp; Regions
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            These three orbital photographs are extracted directly from the original project
            document, preserving their exact regional labels and scientific context.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PDF_BIOMES.map((biome) => (
            <article
              key={biome.id}
              className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0D111A]"
            >
              <div className="aspect-[4/3] overflow-hidden bg-[#121723]">
                <img
                  src={biome.imageUrl}
                  alt={biome.title}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-1 flex-col justify-between p-5 space-y-3">
                <div className="space-y-2">
                  <div className="text-xs font-mono text-[#F4845F]">{biome.originalLabel}</div>
                  <h3 className="font-display text-xl font-bold text-white">{biome.title}</h3>
                  <p className="text-sm text-slate-200 leading-relaxed">{biome.summary}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{biome.details}</p>
                </div>
                <div className="border-t border-white/10 pt-3 text-[11px] text-slate-400">
                  Source:{' '}
                  <a
                    href={biome.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-300 hover:text-white underline inline-flex items-center gap-1"
                  >
                    <span>{biome.attribution}</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 12.10 Future Exploration (PDF Page 5 image) */}
      <section className="rounded-xl border border-white/10 bg-[#0D111A] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-5 aspect-[16/10] lg:aspect-auto overflow-hidden bg-[#121723]">
            <img
              src={PDF_FUTURE_EXPLORATION_IMAGE.imageUrl}
              alt="Astronaut and pressurized rover on Mars (Original PDF Page 5)"
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center space-y-4">
            <div className="text-xs font-mono text-[#F4845F]">
              Future Human &amp; Robotic Exploration
            </div>
            <h2 className="font-display text-2xl font-bold text-white">
              08. Why Scientists Study Mars &amp; Future Human Missions
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Studying Mars helps scientists understand how rocky planets evolve, why Mars lost its
              early atmosphere and surface rivers, and whether ancient microbial life ever emerged
              there [1]. Future robotic and human expeditions aim to test in-situ water-ice
              extraction—such as investigating buried mid-latitude ice sheets in Arcadia Planitia—and
              validate life support, radiation shielding, and surface mobility systems.
            </p>
            <p className="text-xs text-slate-400">
              Illustration: {PDF_FUTURE_EXPLORATION_IMAGE.caption}
            </p>
          </div>
        </div>
      </section>

      {/* 14. Environmental Conditions and Astronaut Safety */}
      <section id="safety" className="space-y-8 border-t border-white/10 pt-10">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-400">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Reference Information — Not a Live Arcadia Planitia Weather Forecast</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Environmental Conditions &amp; Astronaut Safety
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Future crews operating on Mars face physical conditions radically different from Earth.
            The table below summarizes planetary reference parameters alongside actual site-specific
            observations from Perseverance (MEDA) and Curiosity (RAD).
          </p>
        </div>

        {/* Reference Conditions Table */}
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0D111A]">
          <table className="w-full min-w-[700px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-[#121723] text-xs font-semibold text-slate-300">
                <th className="px-4 py-3">Environmental Factor</th>
                <th className="px-4 py-3">General Martian Information</th>
                <th className="px-4 py-3">Why It Matters for Astronauts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8 text-xs text-slate-300">
              {ENVIRONMENTAL_CONDITIONS.map((row) => (
                <tr key={row.factor} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3.5 font-semibold text-white whitespace-nowrap">
                    {row.factor}
                  </td>
                  <td className="px-4 py-3.5 leading-relaxed">{row.martianInfo}</td>
                  <td className="px-4 py-3.5 leading-relaxed text-slate-200">{row.whyItMatters}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MEDA and RAD Clarifications */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-[#0D111A] p-6 space-y-3">
            <div className="text-xs font-mono text-emerald-400">
              Perseverance Rover · Jezero Crater (18.38°N, 77.58°E)
            </div>
            <h3 className="font-display text-lg font-bold text-white">
              MEDA (Mars Environmental Dynamics Analyzer)
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Perseverance’s MEDA suite measures:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-300 list-disc pl-4">
              <li>Wind speed &amp; direction</li>
              <li>Air temperature</li>
              <li>Ground temperature</li>
              <li>Atmospheric pressure</li>
              <li>Relative humidity</li>
              <li>Dust properties &amp; opacity</li>
              <li>Solar &amp; UV radiation bands</li>
            </ul>
            <p className="text-xs text-amber-300 pt-1">
              <strong>Site distinction:</strong> MEDA operates at Jezero Crater, not Arcadia
              Planitia [27].
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0D111A] p-6 space-y-3">
            <div className="text-xs font-mono text-sky-400">
              Curiosity Rover · Gale Crater (5.4°S, 137.8°E)
            </div>
            <h3 className="font-display text-lg font-bold text-white">
              RAD (Radiation Assessment Detector)
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Curiosity’s RAD instrument directly measures high-energy cosmic rays and solar
              energetic particles reaching the Martian surface. During the first ten months
              (~300 sols) of Curiosity’s surface observations in Gale Crater, RAD measured an average
              surface dose rate of approximately{' '}
              <strong className="font-mono text-white tabular-nums">210 microgray per day</strong>{' '}
              (varying with atmospheric column depth and solar activity) [28].
            </p>
            <p className="text-xs text-amber-300 pt-1">
              <strong>Site distinction:</strong> This is a historical measurement from Gale Crater,
              not a direct radiation forecast for Arcadia Planitia [28].
            </p>
          </div>
        </div>

        {/* Interactive Marswalk Preparation Checklist */}
        <div className="rounded-xl border border-white/10 bg-[#0D111A] p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-display text-xl font-bold text-white">
                Interactive Marswalk Preparation Checklist
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Educational planning aid summarizing pre-EVA operational checks—not a certification
                of astronaut safety.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-semibold text-white tabular-nums">
                {checkedIds.length} / {MARSWALK_CHECKLIST.length} Reviewed
              </span>
              <button
                type="button"
                onClick={() => setCheckedIds([])}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/12 bg-[#141A28] px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MARSWALK_CHECKLIST.map((item) => {
              const checked = checkedIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleCheck(item.id)}
                  className={`flex items-start gap-3 rounded-lg border p-3.5 text-left transition-colors cursor-pointer ${
                    checked
                      ? 'border-emerald-500/40 bg-emerald-500/10'
                      : 'border-white/10 bg-[#121723] hover:bg-[#182032]'
                  }`}
                >
                  {checked ? (
                    <CheckSquare className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="text-[11px] font-mono text-slate-400">{item.category}</div>
                    <div className="text-sm font-semibold text-white">{item.label}</div>
                    <p className="text-xs text-slate-300 leading-relaxed">{item.detail}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
