import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export type PageId =
  | 'home'
  | 'globe'
  | 'map'
  | 'missions'
  | 'about'
  | 'sources';

interface NavbarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

const NAV_ITEMS: { id: PageId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'globe', label: 'Mars Explorer' },
  { id: 'map', label: '2D Expedition Map' },
  { id: 'missions', label: 'NASA Missions' },
  { id: 'about', label: 'About Mars' },
  { id: 'sources', label: 'Sources' }
];

export default function Navbar({ activePage, onNavigate }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSelect = (page: PageId) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07090E]/95">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleSelect('home')}
          className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-[#E05A2B] transition-colors cursor-pointer"
        >
          Ares Planetary Explorer
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-7">
          {NAV_ITEMS.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`relative py-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[15px] h-[2px] bg-[#E05A2B]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleSelect(activePage === 'map' ? 'globe' : 'map')}
            className="hidden sm:inline-flex items-center justify-center rounded-md bg-[#E05A2B] px-4 py-2 text-xs font-semibold text-white hover:bg-[#c94c21] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {activePage === 'map' ? 'Open 3D Globe' : 'Arcadia 2D Map'}
          </button>

          <button
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex lg:hidden items-center justify-center rounded-md border border-white/15 bg-[#0F131C] p-2 text-slate-200 hover:bg-[#171D2B] cursor-pointer"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="lg:hidden border-t border-white/10 bg-[#0B0E15] px-4 py-3 space-y-1"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`block w-full rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#E05A2B]/15 text-[#F4845F]'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleSelect('map')}
              className="w-full rounded-md bg-[#E05A2B] px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-[#c94c21] cursor-pointer"
            >
              Open Arcadia 2D Map
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
