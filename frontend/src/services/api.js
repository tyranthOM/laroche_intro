import axios from 'axios';

export const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    const cleanUrl = envUrl.trim().replace(/\/$/, '');
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }
  // Default to relative /api: proxies directly through Vercel edge rewrites to college server (121.241.29.115:5050)
  return '/api';
};

export const getBackendBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '' && !envUrl.startsWith('/')) {
    return envUrl.trim().replace(/\/api\/?$/, '').replace(/\/$/, '');
  }
  return typeof window !== 'undefined' ? window.location.origin : '';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request automatically, if one exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 unauthorized gracefully and auto-logout staff
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRoute =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/signup');

    if (error.response && error.response.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // If on staff route, redirect immediately to the respective staff portal
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      if (currentPath.startsWith('/kitchen') || currentPath.startsWith('/cms')) {
        const loginUrl = currentPath.startsWith('/cms') ? '/cms/login' : '/kitchen/login';
        window.location.href = `${loginUrl}?redirect=${encodeURIComponent(currentPath)}`;
      }
    }
    return Promise.reject(error);
  }
);

export const resolveAssetUrl = (path) => {
  if (!path) return '';
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path;
  }
  // Backend uploads (/uploads/...) are fetched from the Render backend
  if (path.startsWith('/uploads') || path.startsWith('uploads')) {
    const backendBase = getBackendBaseUrl();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${backendBase}${cleanPath}`;
  }
  // Frontend public assets (/menu-items/..., /category-icons/..., /placeholder-food.png)
  // are served directly from the frontend host / CDN
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // Automatically prefer lightweight, high-performance .jpg (80% smaller than .png) for menu items
  if (cleanPath.startsWith('/menu-items/') && cleanPath.toLowerCase().endsWith('.png')) {
    return cleanPath.replace(/\.png$/i, '.jpg');
  }
  return cleanPath;
};

export default api;
