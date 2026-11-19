import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, ArrowUpRight } from 'lucide-react';

// Concentric ring SVG pattern strictly matching the user-uploaded design
const ConcentricRings = ({ dark = false, className = '' }) => (
  <svg
    className={`absolute inset-0 w-full h-full pointer-events-none overflow-hidden ${className}`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="70%"
      cy="35%"
      r="44%"
      fill="none"
      stroke={dark ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)'}
      strokeWidth="1.2"
    />
    <circle
      cx="82%"
      cy="45%"
      r="64%"
      fill="none"
      stroke={dark ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}
      strokeWidth="1.2"
    />
    <circle
      cx="56%"
      cy="22%"
      r="28%"
      fill="none"
      stroke={dark ? 'rgba(0, 0, 0, 0.10)' : 'rgba(255, 255, 255, 0.10)'}
      strokeWidth="1"
    />
  </svg>
);

const CategoriesBentoModal = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Disable background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const scrollToCategorySection = (catTarget) => {
    // Look for matching section element by data-category or header text
    const sections = Array.from(document.querySelectorAll('section[data-category]'));
    let matchedSection = null;

    if (catTarget === 'Sourdough Toasties') {
      matchedSection =
        sections.find((s) => /sandwich/i.test(s.dataset.category)) ||
        sections.find((s) => /snack|quick/i.test(s.dataset.category));
    } else if (catTarget === 'Hot Coffee') {
      matchedSection = sections.find((s) => /hot/i.test(s.dataset.category));
    } else if (catTarget === 'Cold Brews') {
      matchedSection = sections.find((s) => /cold/i.test(s.dataset.category));
    } else if (catTarget === 'Shakes & Coolers') {
      matchedSection =
        sections.find((s) => /mocktail|cooler/i.test(s.dataset.category)) ||
        sections.find((s) => /cold/i.test(s.dataset.category));
    } else if (catTarget === 'Sandwiches') {
      matchedSection = sections.find((s) => /sandwich/i.test(s.dataset.category));
    } else if (catTarget === 'Fries & Snacks') {
      matchedSection = sections.find((s) => /quick|snack|bites/i.test(s.dataset.category));
    } else if (catTarget === 'Desserts') {
      matchedSection =
        sections.find((s) => /waffle|dessert/i.test(s.dataset.category)) ||
        sections.find((s) => /cold/i.test(s.dataset.category));
    } else if (catTarget === 'Combos') {
      matchedSection =
        sections.find((s) => /combo/i.test(s.dataset.category)) ||
        sections.find((s) => /sandwich/i.test(s.dataset.category)) ||
        sections[0];
    }

    if (!matchedSection && sections.length > 0) {
      matchedSection = sections[0];
    }

    if (matchedSection) {
      const navbarEl = document.querySelector('header, .navbar, nav');
      const railEl = document.getElementById('category-rail-section');
      const navbarH = navbarEl ? navbarEl.offsetHeight : 64;
      const railH = railEl ? railEl.offsetHeight : 80;
      const totalOffset = navbarH + railH + 16;

      const elementPosition = matchedSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - totalOffset;

      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth',
      });
    }
  };

  const handleCategoryClick = (catName) => {
    onClose();

    if (location.pathname === '/' || location.pathname === '/menu') {
      setTimeout(() => {
        scrollToCategorySection(catName);
      }, 100);
    } else {
      navigate('/menu');
      setTimeout(() => {
        scrollToCategorySection(catName);
      }, 350);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center bg-black/85 transition-opacity duration-300 overflow-y-auto p-0 sm:p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="w-full max-w-lg mx-auto bg-[#0E0805] border-t sm:border border-[#382316] rounded-t-[36px] sm:rounded-[36px] p-4 sm:p-6 pb-10 text-white shadow-[0_-20px_50px_rgba(0,0,0,0.9)] relative animate-slideUp my-auto max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ scrollbarWidth: 'none' }}
      >
        {/* Top Drag Indicator on Mobile */}
        <div className="w-12 h-1.5 bg-stone-700/80 rounded-full mx-auto mb-3 sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-black text-white tracking-tight">
              Categories
            </h2>
            <p className="text-xs text-stone-400 font-sans mt-0.5">
              Explore artisanal bites, brews &amp; signatures
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close categories"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bento Grid Layout Strictly Matching Attachment */}
        <div className="space-y-3">
          {/* 1. TOP CARD (FULL WIDTH): Sourdough Toasties */}
          <div
            onClick={() => handleCategoryClick('Sourdough Toasties')}
            className="w-full h-44 sm:h-48 rounded-[28px] relative overflow-hidden p-5 flex flex-col justify-between cursor-pointer group shadow-xl transition-all duration-300 active:scale-[0.98] border border-[#B36829]/30 bg-gradient-to-br from-[#8C4A19] via-[#65330F] to-[#3A1A06]"
          >
            <ConcentricRings />

            {/* Top Badges & Arrow */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-black/60 text-white/95 text-xs font-semibold shadow-sm">
                  14 items
                </span>
                <span className="px-3 py-1 rounded-full bg-[#F2BD57] text-[#301601] text-xs font-black tracking-wider uppercase shadow-sm">
                  BESTSELLER
                </span>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 border border-white/25 flex items-center justify-center text-white transition-transform group-hover:scale-110 group-hover:bg-white/30 shadow-md">
                <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
              </div>
            </div>

            {/* Actual Dish Image */}
            <img
              src="/menu-items/4_1_bombay_toasty.png"
              alt="Sourdough Toasties"
              className="absolute right-2 sm:right-6 bottom-2 sm:bottom-3 w-36 sm:w-44 h-28 sm:h-32 object-contain drop-shadow-[0_14px_22px_rgba(0,0,0,0.65)] pointer-events-none transform -rotate-3 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-0"
              loading="lazy"
            />

            {/* Bottom Title */}
            <div className="relative z-10 max-w-[65%]">
              <h3 className="font-serif font-semibold text-2xl sm:text-3xl text-[#FFF6E5] tracking-tight drop-shadow-sm">
                Sourdough Toasties
              </h3>
            </div>
          </div>

          {/* 2. ROW 2: Hot Coffee (Tall Left) + Cold Brews & Shakes (Stacked Right) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Card 2: Hot Coffee (Tall) */}
            <div
              onClick={() => handleCategoryClick('Hot Coffee')}
              className="h-[270px] sm:h-[290px] rounded-[28px] relative overflow-hidden p-4 sm:p-5 flex flex-col justify-between cursor-pointer group shadow-xl transition-all duration-300 active:scale-[0.98] border border-[#552A18]/30 bg-gradient-to-br from-[#381B0F] via-[#241008] to-[#120703]"
            >
              <ConcentricRings />

              {/* Top Row */}
              <div className="flex items-center justify-between relative z-10">
                <span className="px-3 py-1 rounded-full bg-white/20 text-white/95 text-xs font-semibold shadow-sm">
                  9 items
                </span>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 border border-white/25 flex items-center justify-center text-white transition-transform group-hover:scale-110 group-hover:bg-white/30 shadow-md">
                  <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                </div>
              </div>

              {/* Actual Dish Image */}
              <img
                src="/menu-items/1_cappuccino_120ml.png"
                alt="Hot Coffee"
                className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 w-28 sm:w-32 h-28 sm:h-32 object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.7)] pointer-events-none transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
              />

              {/* Bottom Title */}
              <div className="relative z-10">
                <h3 className="font-serif font-semibold text-2xl text-[#FFF6E5] tracking-tight drop-shadow-sm">
                  Hot Coffee
                </h3>
              </div>
            </div>

            {/* Stacked Right Column: Cold Brews & Shakes & Coolers */}
            <div className="flex flex-col gap-3">
              {/* Card 3: Cold Brews */}
              <div
                onClick={() => handleCategoryClick('Cold Brews')}
                className="h-[129px] sm:h-[139px] rounded-[26px] relative overflow-hidden p-4 flex flex-col justify-between cursor-pointer group shadow-xl transition-all duration-300 active:scale-[0.98] border border-[#3E657A]/30 bg-gradient-to-br from-[#294351] via-[#1B2D37] to-[#101C22]"
              >
                <ConcentricRings />

                <div className="flex items-center justify-between relative z-10">
                  <span className="px-3 py-1 rounded-full bg-white/20 text-white/95 text-xs font-semibold shadow-sm">
                    7 items
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/20 border border-white/25 flex items-center justify-center text-white transition-transform group-hover:scale-110 group-hover:bg-white/30 shadow-md">
                    <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>

                <img
                  src="/menu-items/7_cold_coffee_frappe.png"
                  alt="Cold Brews"
                  className="absolute right-1 sm:right-2 bottom-1 w-20 sm:w-24 h-24 sm:h-28 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.65)] pointer-events-none transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />

                <div className="relative z-10 max-w-[65%]">
                  <h3 className="font-serif font-semibold text-xl text-white tracking-tight drop-shadow-sm">
                    Cold Brews
                  </h3>
                </div>
              </div>

              {/* Card 4: Shakes & Coolers */}
              <div
                onClick={() => handleCategoryClick('Shakes & Coolers')}
                className="h-[129px] sm:h-[139px] rounded-[26px] relative overflow-hidden p-4 flex flex-col justify-between cursor-pointer group shadow-xl transition-all duration-300 active:scale-[0.98] border border-[#7F3B66]/30 bg-gradient-to-br from-[#592947] via-[#3B162E] to-[#220B1A]"
              >
                <ConcentricRings />

                <div className="flex items-center justify-between relative z-10">
                  <span className="px-3 py-1 rounded-full bg-white/20 text-white/95 text-xs font-semibold shadow-sm">
                    8 items
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/20 border border-white/25 flex items-center justify-center text-white transition-transform group-hover:scale-110 group-hover:bg-white/30 shadow-md">
                    <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>

                <img
                  src="/menu-items/13_belgian_chocolate_shake.png"
                  alt="Shakes & Coolers"
                  className="absolute right-1 sm:right-2 bottom-1 w-20 sm:w-24 h-24 sm:h-28 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.65)] pointer-events-none transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />

                <div className="relative z-10 max-w-[70%]">
                  <h3 className="font-serif font-semibold text-lg sm:text-xl text-white tracking-tight leading-tight drop-shadow-sm">
                    Shakes &amp; <br />
                    Coolers
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* 3. ROW 3: Sandwiches & Fries & Snacks (2 Equal Cards) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Card 5: Sandwiches */}
            <div
              onClick={() => handleCategoryClick('Sandwiches')}
              className="h-40 sm:h-44 rounded-[26px] relative overflow-hidden p-4 sm:p-5 flex flex-col justify-between cursor-pointer group shadow-xl transition-all duration-300 active:scale-[0.98] border border-[#677D43]/30 bg-gradient-to-br from-[#4A5930] via-[#333D1F] to-[#1E2412]"
            >
              <ConcentricRings />

              <div className="flex items-center justify-between relative z-10">
                <span className="px-3 py-1 rounded-full bg-white/20 text-white/95 text-xs font-semibold shadow-sm">
                  10 items
                </span>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 border border-white/25 flex items-center justify-center text-white transition-transform group-hover:scale-110 group-hover:bg-white/30 shadow-md">
                  <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                </div>
              </div>

              <img
                src="/menu-items/2_3_veg_sandwich_grill.png"
                alt="Sandwiches"
                className="absolute right-1 sm:right-2 bottom-1 w-24 sm:w-28 h-20 sm:h-24 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.65)] pointer-events-none transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />

              <div className="relative z-10 max-w-[65%]">
                <h3 className="font-serif font-semibold text-xl sm:text-2xl text-white tracking-tight drop-shadow-sm">
                  Sandwiches
                </h3>
              </div>
            </div>

            {/* Card 6: Fries & Snacks */}
            <div
              onClick={() => handleCategoryClick('Fries & Snacks')}
              className="h-40 sm:h-44 rounded-[26px] relative overflow-hidden p-4 sm:p-5 flex flex-col justify-between cursor-pointer group shadow-xl transition-all duration-300 active:scale-[0.98] border border-[#B3522E]/30 bg-gradient-to-br from-[#853C22] via-[#5B2513] to-[#361308]"
            >
              <ConcentricRings />

              <div className="flex items-center justify-between relative z-10">
                <span className="px-3 py-1 rounded-full bg-white/20 text-white/95 text-xs font-semibold shadow-sm">
                  11 items
                </span>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 border border-white/25 flex items-center justify-center text-white transition-transform group-hover:scale-110 group-hover:bg-white/30 shadow-md">
                  <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                </div>
              </div>

              <img
                src="/menu-items/2_french_fries.png"
                alt="Fries & Snacks"
                className="absolute right-1 sm:right-2 bottom-1 w-24 sm:w-28 h-20 sm:h-24 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.65)] pointer-events-none transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />

              <div className="relative z-10 max-w-[70%]">
                <h3 className="font-serif font-semibold text-lg sm:text-xl text-white tracking-tight leading-tight drop-shadow-sm">
                  Fries &amp; <br />
                  Snacks
                </h3>
              </div>
            </div>
          </div>

          {/* 4. ROW 4: Desserts (Wide ~60%) + Combos (Compact Golden ~40%) */}
          <div className="grid grid-cols-12 gap-3">
            {/* Card 7: Desserts (Wide) */}
            <div
              onClick={() => handleCategoryClick('Desserts')}
              className="col-span-7 h-36 sm:h-40 rounded-[26px] relative overflow-hidden p-4 sm:p-5 flex flex-col justify-between cursor-pointer group shadow-xl transition-all duration-300 active:scale-[0.98] border border-[#7E4C34]/30 bg-gradient-to-br from-[#563424] via-[#3C2216] to-[#24130B]"
            >
              <ConcentricRings />

              <div className="flex items-center justify-between relative z-10">
                <span className="px-3 py-1 rounded-full bg-white/20 text-white/95 text-xs font-semibold shadow-sm">
                  6 items
                </span>
                <div className="w-8 h-8 rounded-full bg-white/20 border border-white/25 flex items-center justify-center text-white transition-transform group-hover:scale-110 group-hover:bg-white/30 shadow-md">
                  <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                </div>
              </div>

              <img
                src="/menu-items/4_3_chocolate_hazelnut.png"
                alt="Desserts"
                className="absolute right-1 sm:right-2 bottom-1 w-20 sm:w-24 h-20 sm:h-24 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.65)] pointer-events-none transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />

              <div className="relative z-10 max-w-[65%]">
                <h3 className="font-serif font-semibold text-xl sm:text-2xl text-white tracking-tight drop-shadow-sm">
                  Desserts
                </h3>
              </div>
            </div>

            {/* Card 8: Combos (Compact Butterscotch Ochre) */}
            <div
              onClick={() => handleCategoryClick('Combos')}
              className="col-span-5 h-36 sm:h-40 rounded-[26px] relative overflow-hidden p-4 sm:p-5 flex flex-col justify-between cursor-pointer group shadow-xl transition-all duration-300 active:scale-[0.98] border border-[#F7D070]/60 bg-gradient-to-br from-[#F2BD57] via-[#E7AC42] to-[#D6962A]"
            >
              <ConcentricRings dark={true} />

              <div className="flex items-center justify-between relative z-10">
                <span className="px-3 py-1 rounded-full bg-black/20 text-[#2A1605] text-xs font-black shadow-sm">
                  5 items
                </span>
                <div className="w-8 h-8 rounded-full bg-black/15 border border-black/15 flex items-center justify-center text-[#2A1605] transition-transform group-hover:scale-110 shadow-sm">
                  <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                </div>
              </div>

              <img
                src="/menu-items/1_1_bun_maska_plain.png"
                alt="Combos"
                className="absolute right-1 bottom-1 w-16 sm:w-20 h-16 sm:h-20 object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.35)] pointer-events-none transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />

              <div className="relative z-10">
                <h3 className="font-serif font-black text-xl sm:text-2xl text-[#2A1605] tracking-tight drop-shadow-sm">
                  Combos
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesBentoModal;
