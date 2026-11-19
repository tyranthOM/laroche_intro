import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import { useState, useEffect } from 'react';
import IntroVideo from './components/IntroVideo';
import SiteLock from './components/SiteLock';
import BottomNav from './components/BottomNav';
import NotificationSheet from './components/NotificationSheet';
import CategoriesBentoModal from './components/CategoriesBentoModal';
import { getNotificationPermission, notifyOrderPreparing, notifyOrderReady } from './utils/notifications';
import { useSocket } from './hooks/useSocket';
import Auth from './pages/Auth';

import Menu from './pages/Menu';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderHistory from './pages/OrderHistory';
import OrderTracking from './pages/OrderTracking';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import NotFound from './pages/NotFound';
import KitchenDashboard from './pages/kitchen/KitchenDashboard';
import KitchenLogin from './pages/kitchen/KitchenLogin';
import CafeScheduleBanner from './components/CafeScheduleBanner';
import ScrollToTop from './components/ScrollToTop';

// Decides where "/" should redirect to based on auth state
const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="route-loading">Loading...</div>;

  if (user?.role === 'kitchen' || user?.role === 'cms' || user?.role === 'admin') {
    return <Navigate to="/kitchen/dashboard" replace />;
  }
  return <Menu />;
};

const AppRoutes = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isSearchActive = location.pathname === '/menu' && Boolean(searchParams.get('q'));
  const isHeroPage = (location.pathname === '/' || location.pathname === '/menu') && !isSearchActive;

  const isStaffRoute = location.pathname.startsWith('/kitchen') || location.pathname.startsWith('/cms');

  const [showNotifSheet, setShowNotifSheet] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);

  // Global order alert listener across all routes (e.g. while customer is on /menu or /cart)
  const activeOrderId = typeof window !== 'undefined' ? localStorage.getItem('laroche_active_order_id') : null;
  const isOrderTrackingPage = location.pathname.startsWith('/orders/');

  useSocket({
    orderId: isOrderTrackingPage ? null : activeOrderId,
    onOrderStatusUpdated: (updatedOrder) => {
      if (isOrderTrackingPage) return;
      const orderIdStr = (updatedOrder._id || updatedOrder.id)?.toString();
      if (activeOrderId && orderIdStr === activeOrderId) {
        if (updatedOrder.status === 'preparing') {
          notifyOrderPreparing(updatedOrder);
        } else if (updatedOrder.status === 'ready') {
          notifyOrderReady(updatedOrder);
        } else if (updatedOrder.status === 'collected' || updatedOrder.status === 'cancelled') {
          localStorage.removeItem('laroche_active_order_id');
        }
      }
    },
    onOrderReady: (readyOrder) => {
      if (isOrderTrackingPage) return;
      notifyOrderReady(readyOrder);
    },
  });

  // Listener for Categories modal opening across components
  useEffect(() => {
    const handleOpenCategories = () => setShowCategoriesModal(true);
    window.addEventListener('laroche:open-categories', handleOpenCategories);
    return () => window.removeEventListener('laroche:open-categories', handleOpenCategories);
  }, []);

  // Mandatory Notification Sheet: prompt immediately on ordering screens if permission not granted
  useEffect(() => {
    if (isStaffRoute) {
      setShowNotifSheet(false);
      return;
    }

    const perm = getNotificationPermission();
    if (perm === 'granted') {
      setShowNotifSheet(false);
      return;
    }

    const promptTimer = setTimeout(() => {
      const currentPerm = getNotificationPermission();
      if (currentPerm !== 'granted') {
        setShowNotifSheet(true);
      }
    }, 700);

    return () => clearTimeout(promptTimer);
  }, [location.pathname, isStaffRoute]);

  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <Navbar />
      <CafeScheduleBanner />

      <main className={`flex-1 ${!isHeroPage ? 'pt-20 sm:pt-24 md:pt-24' : ''} ${!isStaffRoute ? 'pb-20 md:pb-0' : ''}`}>

        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Auth initialMode="login" />} />
          <Route path="/signup" element={<Auth initialMode="signup" />} />
          
          {/* Staff & Kitchen / CMS Login */}
          <Route path="/kitchen/login" element={<KitchenLogin />} />
          <Route path="/cms/login" element={<KitchenLogin />} />

          {/* Public & Student routes */}
          <Route path="/menu" element={<Menu />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsConditions />} />

          <Route
            path="/checkout"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <OrderHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute allowedRoles={['student', 'kitchen', 'cms', 'admin']}>
                <OrderTracking />
              </ProtectedRoute>
            }
          />

          {/* Staff / Kitchen / CMS Dashboard */}
          <Route
            path="/kitchen/dashboard"
            element={
              <ProtectedRoute allowedRoles={['kitchen', 'cms', 'admin']}>
                <KitchenDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/cms/dashboard"
            element={
              <ProtectedRoute allowedRoles={['kitchen', 'cms', 'admin']}>
                <KitchenDashboard />
              </ProtectedRoute>
            }
          />

          {/* Custom 404 Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <BottomNav onOpenCategories={() => setShowCategoriesModal(true)} />
      <NotificationSheet
        isOpen={showNotifSheet}
        onClose={() => setShowNotifSheet(false)}
      />
      <CategoriesBentoModal
        isOpen={showCategoriesModal}
        onClose={() => setShowCategoriesModal(false)}
      />
    </div>
  );
};

const App = () => {
  const [showIntro, setShowIntro] = useState(() => {
    return !sessionStorage.getItem('introShown');
  });

  // 1-Hour Inactivity Reset: if site closed for > 1 hour, reset session
  useEffect(() => {
    const lastActive = localStorage.getItem('laroche_last_active');
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    if (lastActive && now - parseInt(lastActive, 10) > oneHour) {
      sessionStorage.removeItem('introShown');
      sessionStorage.removeItem('pwa_dismissed');
      setShowIntro(true);
    }

    localStorage.setItem('laroche_last_active', String(now));

    const updateActivity = () => {
      localStorage.setItem('laroche_last_active', String(Date.now()));
    };

    window.addEventListener('click', updateActivity, { passive: true });
    window.addEventListener('scroll', updateActivity, { passive: true });

    return () => {
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, []);

  const handleIntroFinish = () => {
    sessionStorage.setItem('introShown', 'true');
    setShowIntro(false);
  };

  return (
    <BrowserRouter>
      <SiteLock>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              {showIntro && <IntroVideo onFinish={handleIntroFinish} />}
              <AppRoutes />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </SiteLock>
    </BrowserRouter>
  );
};

export default App;