import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const getSocketUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '' && !envUrl.startsWith('/')) {
    return envUrl.replace(/\/api\/?$/, '');
  }
  // Dedicated stable WebSocket connection to Render cloud backend
  return 'https://laroche-web.onrender.com';
};

export const useSocket = ({ onNewOrder, onOrderReady, onOrderStatusUpdated, onStoreStatusChanged, orderId } = {}) => {
  const socketRef = useRef(null);
  const { user, isStudent, isKitchen } = useAuth();

  const onNewOrderRef = useRef(onNewOrder);
  onNewOrderRef.current = onNewOrder;

  const onOrderReadyRef = useRef(onOrderReady);
  onOrderReadyRef.current = onOrderReady;

  const onOrderStatusUpdatedRef = useRef(onOrderStatusUpdated);
  onOrderStatusUpdatedRef.current = onOrderStatusUpdated;

  const onStoreStatusChangedRef = useRef(onStoreStatusChanged);
  onStoreStatusChangedRef.current = onStoreStatusChanged;

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const socket = io(getSocketUrl(), {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionDelay: 3000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      const studentId = user?.id || user?._id;
      // Join kitchen room if kitchen, admin, cms, or if component handles new orders
      if (isKitchen || user?.role === 'admin' || user?.role === 'cms' || Boolean(onNewOrderRef.current)) {
        socket.emit('join_kitchen');
      }
      if (isStudent && studentId) {
        socket.emit('join_student', studentId);
      }
      if (orderId) {
        socket.emit('join_order', orderId);
      }
    });

    socket.on('new_order', (order) => {
      if (onNewOrderRef.current) {
        onNewOrderRef.current(order);
      }
    });

    socket.on('order_ready', (order) => {
      if (onOrderReadyRef.current) {
        onOrderReadyRef.current(order);
      }
    });

    socket.on('order_status_updated', (order) => {
      if (onOrderStatusUpdatedRef.current) {
        onOrderStatusUpdatedRef.current(order);
      }
    });

    socket.on('store_status_changed', (status) => {
      if (onStoreStatusChangedRef.current) {
        onStoreStatusChangedRef.current(status);
      }
    });

    // Keep live connection active when tracking orders.
    // If not actively tracking, allow a relaxed 5-minute background timeout before saving edge resources.
    let disconnectTimer = null;
    const handleVisibilityChange = () => {
      if (typeof document === 'undefined') return;

      if (document.visibilityState === 'hidden') {
        // NEVER disconnect if tracking an active order
        if (!orderId) {
          disconnectTimer = setTimeout(() => {
            if (socket.connected) {
              socket.disconnect();
            }
          }, 5 * 60 * 1000); // 5 minutes
        }
      } else if (document.visibilityState === 'visible') {
        if (disconnectTimer) {
          clearTimeout(disconnectTimer);
          disconnectTimer = null;
        }
        if (!socket.connected) {
          socket.connect();
        } else if (orderId) {
          socket.emit('join_order', orderId);
        }
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      if (disconnectTimer) clearTimeout(disconnectTimer);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      socket.disconnect();
    };
  }, [user, isStudent, isKitchen, orderId]);

  return socketRef.current;
};

