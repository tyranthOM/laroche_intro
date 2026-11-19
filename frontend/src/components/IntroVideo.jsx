import { useState, useRef, useEffect } from 'react';
import { ArrowRight, Volume2, VolumeX, Sparkles, Coffee } from 'lucide-react';
import './IntroVideo.css';

const IntroVideo = ({ onFinish }) => {
  const [fading, setFading] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
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

  useEffect(() => {
    // Explicitly enforce muted DOM property before playback to guarantee autoplay across iOS/Chrome
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
          .then(() => {
            setIsVideoReady(true);
          })
          .catch(() => {
            // Kickstart on first interaction if autoplay policy blocks
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

    const videoEl = videoRef.current;
    const handleTimeUpdate = () => {
      if (videoEl && videoEl.duration) {
        setVideoProgress((videoEl.currentTime / videoEl.duration) * 100);
      }
    };

    if (videoEl) {
      videoEl.addEventListener('timeupdate', handleTimeUpdate);
    }

    // Swipe up or mouse wheel to transition
    const handleWheel = (e) => {
      if (e.deltaY > 20) {
        handleFinish();
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchMove = (e) => {
      const touchEndY = e.touches[0].clientY;
      if (touchStartY - touchEndY > 30) {
        handleFinish();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      if (videoEl) {
        videoEl.removeEventListener('timeupdate', handleTimeUpdate);
      }
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <div
      className={`intro-video-overlay ${fading ? 'fade-out' : ''}`}
      onClick={handleFinish}
      role="banner"
      aria-label="Welcome Intro"
    >
      {/* Background B-Roll Video with graceful fallback */}
      <video
        ref={videoRef}
        className={`intro-video pointer-events-none select-none transition-opacity duration-700 ${
          isVideoReady ? 'opacity-100' : 'opacity-20'
        }`}
        src="/intro.mp4"
        preload="auto"
        autoPlay
        muted
        loop
        playsInline
        onPlaying={() => setIsVideoReady(true)}
        onCanPlay={() => setIsVideoReady(true)}
        webkit-playsinline="true"
        x5-playsinline="true"
        disablePictureInPicture
        disableRemotePlayback
        tabIndex={-1}
        controls={false}
        controlsList="nodownload nofullscreen noremoteplayback"
      />

      {/* Cinematic Multi-layered Backdrop Vignette */}
      <div className="intro-backdrop-vignette" />
      <div className="intro-light-glow" />

      {/* Top Bar: Subtle badge & Sound / Skip Controls */}
      <header className="intro-top-bar">
        <div className="intro-pill-badge">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span>Artisan Bistro & Coffee</span>
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
            onClick={(e) => {
              e.stopPropagation();
              handleFinish();
            }}
          >
            Skip Intro
          </button>
        </div>
      </header>

      {/* Centered Brand Presentation */}
      <main className="intro-center-content">
        <div className="intro-badge-tagline">
          <Coffee className="w-4 h-4 text-amber-400" />
          <span>Welcome to</span>
        </div>

        {/* Brand Logo with ambient glow */}
        <div className="intro-logo-container">
          <img
            src="/logo.png"
            alt="La Roche Cafe"
            className="intro-brand-logo"
            loading="eager"
          />
        </div>

        {/* Professional Typography Subtitle */}
        <div className="intro-text-block">
          <h1 className="intro-title">LA ROCHE CAFE</h1>
          <p className="intro-tagline">
            Handcrafted flavors, fresh brews, and unforgettable moments.
          </p>
        </div>
      </main>

      {/* Mobile-First Interactive Bottom Dock */}
      <footer className="intro-bottom-action">
        <button
          type="button"
          className="intro-cta-button group"
          onClick={(e) => {
            e.stopPropagation();
            handleFinish();
          }}
          aria-label="Explore Menu"
        >
          <span className="intro-cta-text">Explore Menu</span>
          <span className="intro-cta-icon-wrapper">
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </button>

        <p className="intro-hint-text">
          <span>Tap anywhere or swipe up to enter</span>
        </p>

        {/* Subtle Video Progress Bar */}
        <div className="intro-progress-bar-track">
          <div
            className="intro-progress-bar-fill"
            style={{ width: `${Math.min(100, Math.max(0, videoProgress))}%` }}
          />
        </div>
      </footer>
    </div>
  );
};

export default IntroVideo;
