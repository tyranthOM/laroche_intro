import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const DEFAULT_TITLE = 'La Roche Cafe';
const DEFAULT_DESC =
  'Freshly pressed sourdough toasties, specialty coffee, refreshing coolers & artisanal bites at La Roche Cafe, SAKEC Chembur, Mumbai.';
const SITE_URL = 'https://larochecafe.in';
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`;

/**
 * Reusable, zero-dependency SEO & Structured Data Head Manager
 */
export default function SEO({
  title,
  description = DEFAULT_DESC,
  canonical,
  image = DEFAULT_IMAGE,
  type = 'website',
  robots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  schema,
}) {
  const location = useLocation();
  const currentUrl = canonical || `${SITE_URL}${location.pathname === '/' ? '' : location.pathname}`;
  const fullTitle = title
    ? title.includes('La Roche Cafe')
      ? title
      : `${title} | La Roche Cafe`
    : DEFAULT_TITLE;

  useEffect(() => {
    // 1. Update Document Title
    document.title = fullTitle;

    // 2. Helper to set or create meta tag
    const setMeta = (nameOrProperty, value, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${nameOrProperty}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, nameOrProperty);
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    };

    // Standard Meta
    setMeta('description', description);
    setMeta('robots', robots);

    // Open Graph
    setMeta('og:title', fullTitle, true);
    setMeta('og:description', description, true);
    setMeta('og:url', currentUrl, true);
    setMeta('og:image', image, true);
    setMeta('og:type', type, true);
    setMeta('og:site_name', 'La Roche Cafe', true);
    setMeta('og:locale', 'en_IN', true);

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);
    setMeta('twitter:image', image);

    // 3. Update Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', currentUrl);

    // 4. Update dynamic route-specific JSON-LD Schema
    const scriptId = 'dynamic-route-schema';
    let scriptTag = document.getElementById(scriptId);

    if (schema) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = scriptId;
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(schema);
    } else if (scriptTag) {
      scriptTag.remove();
    }

    return () => {
      // Clean up dynamic route schema when unmounting
      const cleanupTag = document.getElementById(scriptId);
      if (cleanupTag) {
        cleanupTag.remove();
      }
    };
  }, [fullTitle, description, currentUrl, image, type, robots, schema]);

  return null;
}
