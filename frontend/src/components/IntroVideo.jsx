import { useState, useRef, useEffect } from 'react';
import { 
  ArrowRight, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Coffee, 
  Clock, 
  QrCode, 
  BellRing, 
  Smartphone,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import './IntroVideo.css';

const FEATURES = [
  {
    id: 'skip-the-line',
    badge: 'Express Ordering',
    icon: Clock,
    title: 'Skip the Long Queue',
    highlight: 'Pre-order in seconds',
    description: 'Browse artisan cafe items, customize with toppings & addons, and place your order directly from your smartphone.',
  },
  {
    id: 'live-tracking',
    badge: 'Live State Machine',
    icon: BellRing,
    title: 'Real-Time Kitchen Updates',
    highlight: 'Instant order notifications',
    description: 'Watch your order move smoothly from Paid to Preparing and Ready to Pickup with instant live alerts.',
  },
  {
    id: 'qr-pickup',
    badge: 'Zero Waiting',
    icon: QrCode,
    title: 'Touchless QR Pickup Pass',
    highlight: 'Flash and collect',
    description: 'Receive your unique digital QR order pass when your food is ready. Simply present it at the counter and pick up fresh.',
  },
  {
    id: 'campus-bistro',
    badge: 'Crafted with Passion',
    icon: Coffee,
    title: 'Fresh Brews & Artisan Bites',
    highlight: 'Best food experience',
    description: 'From signature hot lattes & cold beverages to artisanal pastas, pizzas, and waffle desserts made fresh to order.',
  }
];

const IntroVideo = ({ onFinish }) => {
  const [fading, setFading] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoPlaySlides, setAutoPlaySlides] = useState(true);
  const videoRef = useRef(null);

  const handleFinish = () => {
    if (fading) return;
    setFading(true);
    setTimeout(onFinish, 600);
  };

  const toggleSound = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      const nextMuted = !videoRef.current.muted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  const nextSlide = (e) => {
    if (e) e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % FEATURES.length);
  };

  const prevSlide = (e) => {
    if (e) e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + FEATURES.length) % FEATURES.length);
  };

  // Carousel timer to guide customer through core features
  useEffect(() => {
    if (!autoPlaySlides) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % FEATURES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [autoPlaySlides]);

  // Handle Autoplay & gestures
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      videoRef.current.setAttribute('muted', '');
      videoRef.current.setAttribute('playsinline', '');
      videoRef.current.setAttribute('webkit-playsinline', 'true');

      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsVideoReady(true))
          .catch(() => {
            const handleFirstGesture = () => {
              if (videoRef.current) {
                videoRef.current.defaultMuted = true;
                videoRef.current.muted = true;
                videoRef.current.play().then(() => setIsVideoReady(true)).catch(() => {});
              }
            };
            window.addEventListener('touchstart', handleFirstGesture, { once: true, passive: true });
            window.addEventListener('click', handleFirstGesture, { once: true, passive: true });
          });
      }
    }

    // Swipe up to enter or horizontal swipes between slides
    let startX = 0;
    let startY = 0;
    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      setAutoPlaySlides(false);
    };

    const handleTouchEnd = (e) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = startX - endX;
      const diffY = startY - endY;

      // Vertical swipe up -> Enter App
      if (diffY > 45 && Math.abs(diffY) > Math.abs(diffX)) {
        handleFinish();
      }
      // Horizontal swipe -> Change slide
      else if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0) {
          nextSlide();
        } else {
          prevSlide();
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const activeFeature = FEATURES[currentSlide];
  const IconComponent = activeFeature.icon;

  return (
    <div
      className={`intro-video-overlay ${fading ? 'fade-out' : ''}`}
      role="banner"
      aria-label="Welcome and Feature Showcase"
    >
      {/* Background Video */}
      <video
        ref={videoRef}
        className={`intro-video pointer-events-none select-none transition-opacity duration-700 ${
          isVideoReady ? 'opacity-100' : 'opacity-25'
        }`}
        src="/intro.mp4"
        preload="auto"
        autoPlay
        muted
        loop
        playsInline
        webkit-playsinline="true"
        x5-playsinline="true"
        disablePictureInPicture
        disableRemotePlayback
        tabIndex={-1}
        controls={false}
      />

      {/* Cinematic Overlays */}
      <div className="intro-backdrop-vignette" />
      <div className="intro-light-glow" />

      {/* Top Bar: Brand Pill + Controls */}
      <header className="intro-top-bar">
        <div className="intro-pill-badge">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>La Roche Online Preorder</span>
        </div>

        <div className="intro-top-actions">
          <button
            type="button"
            className="intro-glass-icon-btn"
            onClick={toggleSound}
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            className="intro-skip-pill-btn"
            onClick={handleFinish}
          >
            Skip Intro
          </button>
        </div>
      </header>

      {/* Center Interactive Feature Cards */}
      <main className="intro-center-showcase">
        {/* Compact Brand Header */}
        <div className="intro-brand-header">
          <img
            src="/logo.png"
            alt="La Roche Cafe"
            className="intro-brand-logo-small"
          />
        </div>

        {/* Feature Carousel Card */}
        <div 
          className="intro-feature-card"
          onMouseEnter={() => setAutoPlaySlides(false)}
          onMouseLeave={() => setAutoPlaySlides(true)}
        >
          <div className="intro-card-header">
            <span className="intro-card-badge">
              <IconComponent className="w-3.5 h-3.5 text-amber-300" />
              <span>{activeFeature.badge}</span>
            </span>
            <div className="intro-card-dots">
              {FEATURES.map((feat, idx) => (
                <button
                  key={feat.id}
                  type="button"
                  onClick={() => {
                    setCurrentSlide(idx);
                    setAutoPlaySlides(false);
                  }}
                  className={`intro-dot ${idx === currentSlide ? 'active' : ''}`}
                  aria-label={`Go to feature ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="intro-card-content">
            <h2 className="intro-card-title">{activeFeature.title}</h2>
            <p className="intro-card-highlight">{activeFeature.highlight}</p>
            <p className="intro-card-desc">{activeFeature.description}</p>
          </div>

          {/* Feature Quick Pills */}
          <div className="intro-feature-chips">
            <div className={`intro-chip ${currentSlide === 0 ? 'selected' : ''}`} onClick={() => setCurrentSlide(0)}>
              <Clock className="w-3 h-3" />
              <span>Pre-order</span>
            </div>
            <div className={`intro-chip ${currentSlide === 1 ? 'selected' : ''}`} onClick={() => setCurrentSlide(1)}>
              <BellRing className="w-3 h-3" />
              <span>Live Alert</span>
            </div>
            <div className={`intro-chip ${currentSlide === 2 ? 'selected' : ''}`} onClick={() => setCurrentSlide(2)}>
              <QrCode className="w-3 h-3" />
              <span>QR Pass</span>
            </div>
            <div className={`intro-chip ${currentSlide === 3 ? 'selected' : ''}`} onClick={() => setCurrentSlide(3)}>
              <Coffee className="w-3 h-3" />
              <span>Artisan Menu</span>
            </div>
          </div>

          {/* Navigation Arrows for desktop/click */}
          <button
            type="button"
            className="intro-nav-arrow prev"
            onClick={prevSlide}
            aria-label="Previous feature"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="intro-nav-arrow next"
            onClick={nextSlide}
            aria-label="Next feature"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </main>

      {/* Bottom Action Dock */}
      <footer className="intro-bottom-action">
        <button
          type="button"
          className="intro-cta-button group"
          onClick={handleFinish}
          aria-label="Enter Cafe & Order"
        >
          <span className="intro-cta-text">Enter & Order Now</span>
          <span className="intro-cta-icon-wrapper">
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </button>

        <p className="intro-hint-text">
          <span>Swipe left / right to view features • Tap button to start</span>
        </p>
      </footer>
    </div>
  );
};

export default IntroVideo;
