import { useState, useEffect } from 'react';
import { Sparkles, Share, PlusSquare, CheckCircle, Bell, Lock, ShieldAlert } from 'lucide-react';
import { playOrderBellSound } from '../utils/audioAlerts';
import { sendBrowserNotification } from '../utils/notifications';

const NotificationSheet = ({ isOpen, onClose, onPermissionGranted }) => {
  const [permissionState, setPermissionState] = useState('default');
  const [isRequesting, setIsRequesting] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [infoMsg, setInfoMsg] = useState('');

  // Detect iOS Safari
  const isIOS =
    typeof window !== 'undefined' &&
    /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()) &&
    !window.MSStream;

  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://'));

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // If already granted, do not render
  if (permissionState === 'granted') return null;

  const handlePermissionSuccess = () => {
    setPermissionState('granted');
    localStorage.setItem('laroche_notif_enabled', 'true');
    localStorage.removeItem('laroche_notif_dismissed');

    // Trigger instant mobile test notification & cafe chime
    try {
      sendBrowserNotification('Order Alerts Active', {
        body: 'We will notify you the second chefs start cooking and when your order is ready at the counter.',
        tag: 'laroche-welcome',
      });
    } catch (e) {
      console.warn('Welcome notification error:', e);
    }

    if (onPermissionGranted) onPermissionGranted();
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleAllowClick = () => {
    setInfoMsg('');

    // 1. On iOS Safari in a browser tab, web push is restricted by Apple unless installed to Home Screen
    if (isIOS && !isStandalone) {
      setShowIOSGuide(true);
      return;
    }

    // 2. Fallback if browser doesn't have Notification API
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setInfoMsg('Notifications are not supported in this browser window. Please use Chrome or add to Home Screen.');
      return;
    }

    setIsRequesting(true);

    // 3. SYNCHRONOUS invocation inside click handler to preserve mobile Chrome/Android user gesture
    try {
      const handleResult = (perm) => {
        setIsRequesting(false);
        setPermissionState(perm);
        if (perm === 'granted') {
          handlePermissionSuccess();
        } else if (perm === 'denied') {
          setInfoMsg('Notifications are blocked in your browser settings. Please unlock from the 🔒 icon in the URL bar above.');
        }
      };

      const result = Notification.requestPermission(handleResult);
      if (result && typeof result.then === 'function') {
        result.then(handleResult).catch((err) => {
          console.warn('Notification permission error:', err);
          setIsRequesting(false);
        });
      }
    } catch (err) {
      console.warn('Direct requestNotificationPermission error:', err);
      setIsRequesting(false);
    }
  };

  const handleCheckAgain = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        handlePermissionSuccess();
      } else if (Notification.permission === 'default') {
        handleAllowClick();
      } else {
        setInfoMsg('Still blocked. Please tap the 🔒 icon next to larochecafe.in in your browser URL bar, set Notifications to "Allow", then tap Check Again.');
      }
    } else if (isStandalone || !isIOS) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/85 transition-opacity duration-300"
      aria-modal="true"
      role="dialog"
    >
      {/* Bottom Sheet Container (Mandatory Gate) */}
      <div
        className="w-full max-w-lg mx-auto bg-[#140C08] sm:bg-[#18110D] border-t border-[#3D2619] rounded-t-[32px] sm:rounded-t-[36px] p-6 pb-8 text-center text-white shadow-[0_-16px_40px_rgba(0,0,0,0.8)] relative animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Drag Handle */}
        <div className="w-12 h-1.5 bg-stone-700/80 rounded-full mx-auto mb-5" />

        {!showIOSGuide && permissionState !== 'denied' ? (
          <>
            {/* District-Style 3D Bell with Floating % Bubbles and Twinkle Stars */}
            <div className="relative w-36 h-28 mx-auto mb-4 flex items-center justify-center">
              {/* Warm Purple & Terracotta Ambient Glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#A6472B]/40 via-[#8B34B8]/30 to-[#F7D070]/20 rounded-full blur-2xl animate-pulse" />

              {/* Left Floating % Bubble */}
              <div className="absolute -left-2 top-6 w-9 h-9 rounded-full bg-gradient-to-br from-[#8C3BE0] to-[#581C87] border border-white/20 shadow-lg flex items-center justify-center transform -rotate-12 animate-bounce-subtle">
                <span className="text-white font-black text-xs drop-shadow">%</span>
              </div>

              {/* Right Floating % Bubble */}
              <div
                className="absolute -right-2 top-7 w-10 h-10 rounded-full bg-gradient-to-br from-[#9333EA] to-[#6B21A8] border border-white/20 shadow-lg flex items-center justify-center transform rotate-12 animate-bounce-subtle"
                style={{ animationDelay: '0.4s' }}
              >
                <span className="text-white font-black text-xs drop-shadow">%</span>
              </div>

              {/* Twinkling Sparkle Stars */}
              <Sparkles className="absolute -top-1 left-7 w-4 h-4 text-[#F7D070] animate-pulse" />
              <Sparkles className="absolute top-1 -right-1 w-4 h-4 text-purple-300 animate-pulse" />

              {/* Big 3D Bell Graphic */}
              <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-[#8035C9] via-[#6322A3] to-[#3B0764] border border-purple-400/40 shadow-[0_10px_25px_rgba(110,34,180,0.5)] flex items-center justify-center transform active:scale-95 transition-transform">
                <Bell className="w-10 h-10 text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]" />

                {/* Live Badge pinned on bell */}
                <span className="absolute -bottom-2 px-2.5 py-0.5 rounded-full bg-[#F7D070] text-[#160E0A] text-[9px] font-black uppercase tracking-wider shadow border border-[#160E0A]/40">
                  Live
                </span>
              </div>
            </div>

            {/* Title & Copy */}
            <h3 className="text-2xl font-serif font-black text-white tracking-tight mb-2">
              Allow Notifications to Continue
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 font-sans leading-relaxed max-w-sm mx-auto mb-6">
              To order and receive live status updates the moment chefs start cooking and your meal is ready, please allow notifications.
            </p>

            {infoMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs leading-relaxed text-left">
                {infoMsg}
              </div>
            )}

            {/* Mandatory Action Button */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleAllowClick}
                disabled={isRequesting}
                className="w-full py-4 rounded-full bg-[#F7D070] hover:bg-[#F2BD57] text-[#140C08] font-black text-sm uppercase tracking-wider shadow-[0_4px_20px_rgba(247,208,112,0.4)] transition-all active:scale-[0.98] disabled:opacity-70 cursor-pointer"
              >
                {isRequesting ? 'Requesting Permission...' : 'Allow Notifications'}
              </button>
              <p className="text-[11px] text-stone-400 font-medium">
                Mandatory for real-time kitchen order alerts &amp; status updates
              </p>
            </div>
          </>
        ) : permissionState === 'denied' ? (
          /* When Browser Previously Blocked Notifications */
          <div className="text-left space-y-4 animate-fadeIn">
            <div className="text-center mb-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center mb-2 shadow-lg">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif font-bold text-white">Notifications Are Blocked</h3>
              <p className="text-xs text-stone-300 mt-1">
                Your browser is currently blocking notifications for this site.
              </p>
            </div>

            <div className="bg-[#24150E] border border-[#3D2619] rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-black text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div className="text-xs text-stone-200">
                  Tap the <strong className="text-white">🔒 lock / settings icon</strong> in the browser address bar at the top of your screen.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-black text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div className="text-xs text-stone-200">
                  Change <strong className="text-white">Notifications</strong> from "Block" to <strong className="text-emerald-400">"Allow"</strong>.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-black text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div className="text-xs text-stone-200">
                  Return here and tap <strong className="text-white">"Check Permission"</strong> below.
                </div>
              </div>
            </div>

            {infoMsg && (
              <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs leading-relaxed">
                {infoMsg}
              </div>
            )}

            <button
              type="button"
              onClick={handleCheckAgain}
              className="w-full py-4 rounded-full bg-[#F7D070] hover:bg-[#F2BD57] text-[#140C08] font-black text-sm uppercase tracking-wider shadow-lg transition-all active:scale-[0.98] cursor-pointer"
            >
              Check Permission
            </button>
          </div>
        ) : (
          /* iOS 2-Step Native Guidance (for iPhone Safari) */
          <div className="text-left space-y-4 animate-fadeIn">
            <div className="text-center mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#A6472B] to-[#7E351F] text-white mx-auto flex items-center justify-center mb-2 shadow-lg">
                <Share className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif font-bold text-white">Enable iPhone Alerts</h3>
              <p className="text-xs text-stone-300 mt-1">
                iOS requires saving La Roche to your Home Screen to deliver live order alerts.
              </p>
            </div>

            <div className="bg-[#24150E] border border-[#3D2619] rounded-2xl p-3.5 space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#A6472B] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div className="text-xs text-stone-200">
                  Tap the <strong className="text-white">Share button</strong> (
                  <Share className="w-3.5 h-3.5 inline text-[#F7D070]" />) in Safari's bottom toolbar.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#A6472B] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div className="text-xs text-stone-200">
                  Scroll down and tap <strong className="text-white">"Add to Home Screen" ⊕</strong>.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-stone-300">
                  Open from your home screen — you'll get instant kitchen sound alerts and live status calls!
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckAgain}
              className="w-full py-3.5 rounded-full bg-[#F7D070] hover:bg-[#F2BD57] text-[#140C08] font-black text-xs uppercase tracking-wider shadow-lg transition-all active:scale-[0.98] cursor-pointer"
            >
              I've Added to Home Screen
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSheet;
