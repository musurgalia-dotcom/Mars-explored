import { useEffect, useState } from 'react';
import Navbar, { PageId } from './components/Navbar';
import HomePage from './components/HomePage';
import MarsGlobe3D from './components/MarsGlobe3D';
import ExpeditionMap2D from './components/ExpeditionMap2D';
import MissionsPage from './components/MissionsPage';
import AboutMarsPage from './components/AboutMarsPage';
import SourcesPage from './components/SourcesPage';

export default function App() {
  const [activePage, setActivePage] = useState<PageId>('home');
  const [globeLocationId, setGlobeLocationId] = useState<string | undefined>('olympus-mons');

  const handleNavigate = (page: PageId, locationId?: string) => {
    if (locationId) {
      setGlobeLocationId(locationId);
    }
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const titles: Record<PageId, string> = {
      home: 'Ares Planetary Explorer — Mars Exploration Platform',
      globe: '3D Mars Explorer — Ares Planetary Explorer',
      map: 'Arcadia Planitia 2D Expedition Map — Ares Planetary Explorer',
      missions: 'NASA Mars Missions & Instruments — Ares Planetary Explorer',
      about: 'About Mars & Astronaut Safety — Ares Planetary Explorer',
      sources: 'Scientific Sources & References — Ares Planetary Explorer'
    };
    document.title = titles[activePage];
  }, [activePage]);

  return (
    <div className="min-h-screen flex flex-col bg-[#07090E] text-[#E6E9F0]">
      <Navbar activePage={activePage} onNavigate={(p) => handleNavigate(p)} />

      <main className="flex-1">
        {activePage === 'home' && <HomePage onNavigate={handleNavigate} />}

        {activePage === 'globe' && (
          <section aria-label="3D Mars Explorer">
            <MarsGlobe3D
              mode="explorer"
              initialLocationId={globeLocationId}
              onNavigateTo2DMap={() => handleNavigate('map')}
            />
          </section>
        )}

        {activePage === 'map' && <ExpeditionMap2D />}
        {activePage === 'missions' && <MissionsPage />}
        {activePage === 'about' && <AboutMarsPage />}
        {activePage === 'sources' && <SourcesPage />}
      </main>

      {activePage !== 'globe' && (
        <footer className="border-t border-white/10 bg-[#07090E]">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 text-xs text-slate-400">
            <div>
              <span className="font-display font-semibold text-white">Ares Planetary Explorer</span>
              <span className="mx-2">·</span>
              <span>Planetary data from NASA Mars Trek, JPL, USGS Astrogeology &amp; PSI SWIM</span>
            </div>
            <div className="flex flex-wrap items-center gap-5">
              <button
                type="button"
                onClick={() => handleNavigate('globe')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                3D Mars Globe
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('map')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Arcadia 2D Map
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('missions')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                NASA Missions
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('about')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                About Mars
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('sources')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Sources [1–31]
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
