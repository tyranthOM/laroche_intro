/**
 * Web Notification Utilities for La Roche Cafe
 * Handles Service Worker notifications (mobile Chrome/Android/PWA) and standard browser notifications.
 */

import { playOrderBellSound } from './audioAlerts';

export const isIOSDevice = () => {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua) && !window.MSStream;
};

export const isStandalonePWA = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
};

export const isNotificationSupported = () => {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window;
};

export const getNotificationPermission = () => {
  if (!isNotificationSupported()) {
    return isIOSDevice() ? 'ios_unsupported' : 'unsupported';
  }
  return Notification.permission; // 'default' | 'granted' | 'denied'
};

export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined') {
    return { success: false, permission: 'unsupported' };
  }

  // 1. Direct native browser permission request if Notification API is available
  if (typeof Notification !== 'undefined' && typeof Notification.requestPermission === 'function') {
    try {
      let permission;
      try {
        permission = await Notification.requestPermission();
      } catch (e) {
        permission = await new Promise((resolve) => {
          Notification.requestPermission(resolve);
        });
      }

      if (permission === 'granted') {
        try {
          playOrderBellSound();
        } catch (e) {}

        await sendBrowserNotification('Order Alerts Active', {
          body: 'You will receive real-time notifications when your meal is preparing and ready at the counter.',
          tag: 'laroche-welcome',
        });

        return { success: true, permission: 'granted' };
      }

      if (permission === 'denied') {
        return {
          success: false,
          permission: 'denied',
          message: 'Notifications are blocked in your browser settings. Please click the 🔒 icon in your address bar to enable notifications.',
        };
      }

      return { success: false, permission: permission || 'default' };
    } catch (err) {
      console.warn('Error requesting native browser notification permission:', err);
    }
  }

  // 2. iOS Safari fallback if Web Push requires PWA Home Screen icon
  if (isIOSDevice() && !isStandalonePWA()) {
    return {
      success: false,
      permission: 'ios_requires_install',
      message: 'On iPhone, notifications require adding the app to your Home Screen first (Share → Add to Home Screen).',
    };
  }

  return {
    success: false,
    permission: 'unsupported',
    message: 'Your current browser does not support web notifications.',
  };
};

export const sendBrowserNotification = async (title, options = {}) => {
  // 1. Acoustic audio alert
  try {
    playOrderBellSound();
  } catch (e) {}

  // 2. Mobile haptic vibration
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([300, 150, 300, 150, 450]);
    }
  } catch (e) {}

  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const defaultOptions = {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [300, 150, 300, 150, 450],
    requireInteraction: true,
    tag: 'laroche-order-alert',
    renotify: true,
    data: { url: options.url || '/orders' },
    ...options,
  };

  try {
    // 1. Prefer Service Worker (Required on Android Chrome / Mobile PWA / iOS)
    if ('serviceWorker' in navigator) {
      // Broadcast via postMessage to active controller
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title,
          ...defaultOptions,
        });
      }

      // Also invoke showNotification directly on serviceWorker registration
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) => setTimeout(() => reject(new Error('SW ready timeout')), 2500)),
      ]).catch(() => null);

      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, defaultOptions);
        return true;
      }
    }

    // 2. Fallback to standard Desktop Notification constructor (Desktop browsers)
    if (typeof Notification !== 'undefined') {
      new Notification(title, defaultOptions);
      return true;
    }
  } catch (err) {
    console.warn('[Notification] Failed to trigger native browser notification:', err);
    return false;
  }
};

export const notifyOrderPreparing = (order) => {
  const shortId = order?.orderNumber ? `#${order.orderNumber}` : (order?._id ? `#${order._id.slice(-4).toUpperCase()}` : '');
  return sendBrowserNotification('Order is Being Prepared', {
    body: `Chefs at La Roche Cafe are now freshly preparing your order ${shortId}. It will be ready shortly!`,
    tag: `order-prep-${order?._id || Date.now()}`,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
  });
};

export const notifyOrderReady = (order) => {
  const shortId = order?.orderNumber ? `#${order.orderNumber}` : (order?._id ? `#${order._id.slice(-4).toUpperCase()}` : '');
  return sendBrowserNotification('Order Ready for Pickup', {
    body: `Your delicious meal for Order ${shortId} is hot & fresh at the counter. Grab it now!`,
    tag: `order-ready-${order?._id || Date.now()}`,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    requireInteraction: true,
  });
};
