import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, LayoutGrid, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const BottomNav = ({ onOpenCategories }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const { user } = useAuth();

  // Hide bottom nav on kitchen and CMS screens
  if (location.pathname.startsWith('/kitchen') || location.pathname.startsWith('/cms')) {
    return null;
  }

  const handleHomeClick = () => {
    if (location.pathname === '/' || location.pathname === '/menu') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/menu');
    }
  };

  const handleCategoriesClick = () => {
    if (onOpenCategories) {
      onOpenCategories();
    } else {
      window.dispatchEvent(new CustomEvent('laroche:open-categories'));
    }
  };

  const handleCartClick = () => {
    navigate('/cart');
  };

  const handleProfileClick = () => {
    if (user) {
      navigate('/orders');
    } else {
      navigate('/login?redirect=/orders');
    }
  };

  const isHomeActive = (location.pathname === '/' || location.pathname === '/menu') && !location.hash;
  const isCartActive = location.pathname === '/cart' || location.pathname === '/checkout';
  const isProfileActive = location.pathname === '/orders' || location.pathname === '/login' || location.pathname === '/signup';

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#160E0A] border-t border-[#3D2E24]/80 shadow-[0_-4px_24px_rgba(0,0,0,0.4)]"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
      aria-label="Mobile Navigation"
    >
      <div className="grid grid-cols-4 items-center h-16 max-w-md mx-auto px-2">
        {/* 1. Home */}
        <button
          type="button"
          onClick={handleHomeClick}
          className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 ${
            isHomeActive ? 'text-[#F7D070]' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <div className={`p-1 rounded-full transition-colors ${isHomeActive ? 'bg-[#F7D070]/15' : ''}`}>
            <Home className="w-5 h-5" strokeWidth={isHomeActive ? 2.5 : 2} />
          </div>
          <span className="text-[10px] font-bold tracking-tight">Home</span>
        </button>

        {/* 2. Categories */}
        <button
          type="button"
          onClick={handleCategoriesClick}
          className="flex flex-col items-center justify-center gap-1 text-stone-400 hover:text-stone-200 transition-all duration-200 active:scale-95"
        >
          <div className="p-1 rounded-full">
            <LayoutGrid className="w-5 h-5" strokeWidth={2} />
          </div>
          <span className="text-[10px] font-bold tracking-tight">Categories</span>
        </button>

        {/* 3. Cart */}
        <button
          type="button"
          onClick={handleCartClick}
          className={`relative flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 ${
            isCartActive ? 'text-[#F7D070]' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <div className={`relative p-1 rounded-full transition-colors ${isCartActive ? 'bg-[#F7D070]/15' : ''}`}>
            <ShoppingBag className="w-5 h-5" strokeWidth={isCartActive ? 2.5 : 2} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#A6472B] text-white text-[10px] font-black flex items-center justify-center shadow-md animate-pulse-subtle border border-[#160E0A]">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold tracking-tight">Cart</span>
        </button>

        {/* 4. Profile */}
        <button
          type="button"
          onClick={handleProfileClick}
          className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 ${
            isProfileActive ? 'text-[#F7D070]' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <div className={`p-1 rounded-full transition-colors ${isProfileActive ? 'bg-[#F7D070]/15' : ''}`}>
            {user?.name ? (
              <div className="w-5 h-5 rounded-full bg-[#A6472B] text-white text-[10px] font-bold flex items-center justify-center">
                {user.name.charAt(0).toUpperCase()}
              </div>
            ) : (
              <User className="w-5 h-5" strokeWidth={isProfileActive ? 2.5 : 2} />
            )}
          </div>
          <span className="text-[10px] font-bold tracking-tight">
            {user ? 'Profile' : 'Sign In'}
          </span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
