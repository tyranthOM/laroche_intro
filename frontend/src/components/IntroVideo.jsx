import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Coffee, 
  Search, 
  CreditCard, 
  CheckCircle2, 
  Store, 
  ArrowRight, 
  Flame, 
  LayoutGrid, 
  ShoppingBag, 
  ShieldCheck, 
  LogIn, 
  UserPlus, 
  ChevronRight, 
  Clock, 
  SlidersHorizontal 
} from 'lucide-react';
import './IntroVideo.css';

const GoogleIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z" />
    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z" />
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
  </svg>
);

const playAudioBeep = (freq = 600, duration = 0.08, type = 'sine', gainVal = 0.08) => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  } catch (e) {
    // audio policy safe
  }
};

const TOUR_ZONES = [
  { id: 1, label: 'EXPLORE & MENU', icon: LayoutGrid, kicker: '01 / EXPLORE BISTRO', title: 'Interactive menu, search & live category rails' },
  { id: 2, label: 'GOOGLE OAUTH SIGN UP', icon: UserPlus, kicker: '02 / FAST ONBOARDING', title: '1-tap Google sign up & campus profile sync' },
  { id: 3, label: 'CUSTOMIZE & CART', icon: ShoppingBag, kicker: '03 / PRE-ORDER CUSTOMIZATION', title: 'Toppings, addons & 1-tap cart review' },
  { id: 4, label: 'INSTANT PAY & KDS', icon: CreditCard, kicker: '04 / REAL-TIME KITCHEN QUEUE', title: 'Razorpay UPI & live socket state transitions' },
  { id: 5, label: 'COUNTER TOKEN & QR', icon: Store, kicker: '05 / ZERO-QUEUE PICKUP', title: 'Show your token at the cafe counter & collect hot' }
];

const IntroVideo = ({ onFinish }) => {
  const [fading, setFading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentAct, setCurrentAct] = useState(1);
  const [googleStepDone, setGoogleStepDone] = useState(false);
  
  const containerRef = useRef(null);
  const cameraRigRef = useRef(null);
  const videoRef = useRef(null);
  const lightOrbRef = useRef(null);
  const cardRigRef = useRef(null);
  const scanBeamRef = useRef(null);
  const stampRef = useRef(null);
  const timelineRef = useRef(null);

  const handleFinish = () => {
    if (fading) return;
    setFading(true);
    if (timelineRef.current) {
      timelineRef.current.kill();
    }
    setTimeout(onFinish, 600);
  };

  const toggleSound = (e) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
    if (!isMuted) {
      playAudioBeep(440, 0.05, 'sine', 0.05);
    }
  };

  const jumpToAct = (actNum) => {
    setCurrentAct(actNum);
    if (!isMuted) {
      if (actNum === 5) playAudioBeep(987.77, 0.35, 'triangle', 0.18);
      else if (actNum === 4) playAudioBeep(784, 0.1, 'sine', 0.1);
      else if (actNum === 2) playAudioBeep(640, 0.08, 'sine', 0.1);
      else playAudioBeep(520, 0.06, 'sine', 0.08);
    }
  };

  useEffect(() => {
    const camera = cameraRigRef.current;
    const card = cardRigRef.current;
    const beam = scanBeamRef.current;
    const stamp = stampRef.current;
    const orb = lightOrbRef.current;

    if (!camera || !card) return;

    // Reset initial 3D positions
    gsap.set(camera, { transformPerspective: 1200, transformStyle: "preserve-3d" });
    gsap.set(card, { transformStyle: "preserve-3d", rotationY: 0, rotationX: 0, z: 0 });

    // Extended 24-second timeline with 5 distinct comprehensive acts
    const tl = gsap.timeline({
      repeat: -1,
      defaults: { ease: "power3.inOut" }
    });
    timelineRef.current = tl;

    // ACT 1 (0.0s - 4.8s): THE BROWSE TOUR (Deep 3D push-through, search & Bento categories)
    tl.call(() => {
      jumpToAct(1);
    }, null, 0.1)
      .fromTo(camera, 
        { z: -170, rotationX: 5, rotationY: -6 }, 
        { z: 0, rotationX: 0, rotationY: 0, duration: 4.6, ease: "power2.out" }, 
        0
      )
      .fromTo(orb,
        { x: -160, y: -80, scale: 0.9 },
        { x: 160, y: 50, scale: 1.3, duration: 4.6, ease: "sine.inOut" },
        0
      );

    // ACT 2 (4.8s - 9.6s): GOOGLE SIGN UP / OAUTH INTEGRATION
    tl.call(() => {
      jumpToAct(2);
      setGoogleStepDone(false);
      setTimeout(() => setGoogleStepDone(true), 1400);
    }, null, 4.8)
      .to(camera, { z: 70, rotationY: -7, rotationX: 3, duration: 4.6, ease: "power2.inOut" }, 4.8)
      .to(card, { rotationY: 8, rotationX: -2, duration: 4.6, ease: "power2.inOut" }, 4.8)
      .fromTo(".bang-tour-auth-preview", { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.7, ease: "back.out(1.4)" }, 5.0);

    // ACT 3 (9.6s - 14.4s): DOLLY IN & PRE-ORDER CART WITH CUSTOM ADDONS
    tl.call(() => {
      jumpToAct(3);
    }, null, 9.6)
      .to(camera, { z: 100, rotationY: 7, rotationX: -4, duration: 4.6, ease: "power2.inOut" }, 9.6)
      .to(card, { rotationY: -7, rotationX: 3, duration: 4.6, ease: "power2.inOut" }, 9.6)
      .fromTo(".bang-tour-cart-preview", { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.7, ease: "back.out(1.4)" }, 9.8);

    // ACT 4 (14.4s - 19.2s): INSTANT RAZORPAY UPI & LIVE KITCHEN PIPELINE
    tl.call(() => {
      jumpToAct(4);
    }, null, 14.4)
      .to(camera, { z: 45, rotationY: -9, rotationX: 4, duration: 4.6, ease: "power3.inOut" }, 14.4)
      .to(card, { rotationY: 9, rotationX: -2, duration: 4.6, ease: "power3.inOut" }, 14.4)
      .fromTo(beam, { top: "-10%", opacity: 0 }, { top: "115%", opacity: 0.85, duration: 1.5, ease: "power1.inOut" }, 14.6)
      .fromTo(".bang-tour-payment-preview", { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, 14.8);

    // ACT 5 (19.2s - 25.0s): THE CLIMAX — STAMP TOKEN AT REAL CAFE COUNTER
    tl.call(() => {
      jumpToAct(5);
    }, null, 19.2)
      .to(camera, { z: -10, rotationY: 0, rotationX: 0, duration: 2.8, ease: "elastic.out(1, 0.85)" }, 19.2)
      .to(card, { rotationY: 0, rotationX: 0, z: 0, duration: 2.8, ease: "elastic.out(1, 0.85)" }, 19.2)
      .fromTo(stamp, 
        { scale: 2.5, opacity: 0, rotation: -12, filter: "blur(8px)" }, 
        { scale: 1, opacity: 1, rotation: 0, filter: "blur(0px)", duration: 0.65, ease: "back.out(2)" }, 
        19.5
      )
      .fromTo(".bang-tour-token-preview", 
        { opacity: 0, scale: 0.9 }, 
        { opacity: 1, scale: 1, duration: 0.7, ease: "power2.out" }, 
        19.7
      );

    // Smooth reset
    tl.to(camera, { opacity: 0.95, duration: 0.6 }, 24.4);

    // Hidden key controls (Space = pause, R = restart)
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        if (tl.paused()) tl.play();
        else tl.pause();
      } else if (e.key === 'r' || e.key === 'R') {
        tl.restart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      tl.kill();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMuted]);

  const activeZone = TOUR_ZONES[currentAct - 1];

  return (
    <div
      ref={containerRef}
      className={`bang-motion-viewport ${fading ? 'fade-out' : ''}`}
      role="banner"
      aria-label="La Roche Cafe Complete App Tour"
    >
      {/* Background Ambience Layer */}
      <video
        ref={videoRef}
        className="bang-bg-video"
        src="/intro.mp4"
        preload="auto"
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="bang-ambient-grid" />
      <div className="bang-vignette-overlay" />
      <div ref={lightOrbRef} className="bang-drifting-orb" />

      {/* Top HUD Controls */}
      <header className="bang-top-hud">
        <div className="bang-brand-pill">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span>La Roche • Interactive Tour</span>
        </div>

        <div className="bang-hud-right">
          <button
            type="button"
            className="bang-icon-btn"
            onClick={toggleSound}
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            title={isMuted ? 'Muted' : 'Sound Active'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-300" />}
          </button>

          <button
            type="button"
            className="bang-skip-btn"
            onClick={handleFinish}
          >
            Skip Tour
          </button>
        </div>
      </header>

      {/* 3D Camera Rig & World Container */}
      <div className="bang-world-container">
        <div ref={cameraRigRef} className="bang-camera-rig">
          
          {/* Main Major Screen: Full-Width Living App Canvas */}
          <div ref={cardRigRef} className="bang-anchor-card-expanded">
            
            {/* Scan Beam */}
            <div ref={scanBeamRef} className="bang-scan-beam" />

            {/* Continuous App Frame Top Bar */}
            <div className="bang-app-header-bar">
              <div className="bang-app-brand">
                <img src="/logo.png" alt="La Roche" className="bang-app-logo" />
                <span className="bang-app-badge">CAMPUS BISTRO</span>
              </div>

              {/* Tour Navigator Tabs */}
              <div className="bang-tour-tabs">
                {TOUR_ZONES.map((zone) => {
                  const Icon = zone.icon;
                  return (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => jumpToAct(zone.id)}
                      className={`bang-tour-tab ${currentAct === zone.id ? 'active' : ''}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{zone.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ACT 1: EXPLORE & MENU DISCOVERY */}
            {currentAct === 1 && (
              <div className="bang-act-screen">
                <div className="bang-search-interactive">
                  <Search className="w-4 h-4 text-amber-400" />
                  <span className="bang-search-text">Search cappuccino, peri peri fries, waffles, pizza...</span>
                </div>

                <div className="bang-bento-grid-preview">
                  <div className="bang-bento-tile highlight">
                    <Coffee className="w-5 h-5 text-amber-300" />
                    <div>
                      <strong>Fresh Brews</strong>
                      <p>Hot Espresso, Lattes & Cold Brew</p>
                    </div>
                  </div>
                  <div className="bang-bento-tile">
                    <span className="text-xl">🍕</span>
                    <div>
                      <strong>Stone Pizza</strong>
                      <p>Paneer Tikka, Veggie Overload</p>
                    </div>
                  </div>
                  <div className="bang-bento-tile">
                    <span className="text-xl">🍟</span>
                    <div>
                      <strong>Crispy Sides</strong>
                      <p>Peri Peri Fries, Cheesy Maggi</p>
                    </div>
                  </div>
                  <div className="bang-bento-tile">
                    <span className="text-xl">🧇</span>
                    <div>
                      <strong>Desserts</strong>
                      <p>Nutella Waffles, Brownie Shake</p>
                    </div>
                  </div>
                </div>

                <div className="bang-mock-bottom-nav">
                  <span className="nav-item active">☕ Menu</span>
                  <span className="nav-item">🗂️ Categories</span>
                  <span className="nav-item">🛍️ Cart (1)</span>
                  <span className="nav-item">📋 Orders</span>
                </div>
              </div>
            )}

            {/* ACT 2: GOOGLE SIGN UP & OAUTH */}
            {currentAct === 2 && (
              <div className="bang-act-screen bang-tour-auth-preview">
                <div className="bang-auth-card-mock">
                  <div className="bang-auth-header">
                    <div className="bang-oauth-pill">
                      <GoogleIcon />
                      <span>Google OAuth 2.0 Integration</span>
                    </div>
                    <h4>1-Tap Quick Student Sign Up</h4>
                    <p>Instant authentication with your college or personal Google account</p>
                  </div>

                  {/* Interactive Google Sign Up Button */}
                  <div className="bang-google-oauth-btn-mock">
                    <GoogleIcon />
                    <span>Continue with Google</span>
                    <span className="oauth-verified-tag">Instant Access</span>
                  </div>

                  {/* Or divider */}
                  <div className="bang-auth-divider">
                    <span>or sign in with campus email / mobile OTP</span>
                  </div>

                  {/* Student Verification Badge */}
                  <div className="bang-auth-perk-row">
                    <div className="auth-perk">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{googleStepDone ? 'Authenticated as student@campus.edu' : 'Zero manual password hassle'}</span>
                    </div>
                    <div className="auth-perk">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>End-to-End JWT Session Security</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ACT 3: CUSTOMIZE & PRE-ORDER CART */}
            {currentAct === 3 && (
              <div className="bang-act-screen bang-tour-cart-preview">
                <div className="bang-cart-expanded-card">
                  <div className="bang-cart-top">
                    <div className="bang-cart-prod-info">
                      <Coffee className="w-8 h-8 text-amber-400" />
                      <div>
                        <h4>Hazelnut Cappuccino (Grande)</h4>
                        <p className="bang-meta">Fresh Double Roast • Whole Milk</p>
                      </div>
                    </div>
                    <span className="bang-cart-price">₹170</span>
                  </div>

                  <div className="bang-addons-selector">
                    <span className="bang-addon-chip selected">✓ Extra Espresso Shot (+₹30)</span>
                    <span className="bang-addon-chip selected">✓ Hazelnut Drizzle</span>
                    <span className="bang-addon-chip">Less Sugar</span>
                  </div>

                  <div className="bang-cart-calc-row">
                    <span>Subtotal + Taxes</span>
                    <strong>Total: ₹170.00</strong>
                  </div>
                </div>

                <div className="bang-preorder-perk-banner">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Placed ahead of time • Prepared when you reach</span>
                </div>
              </div>
            )}

            {/* ACT 4: INSTANT PAY & KITCHEN KDS PIPELINE */}
            {currentAct === 4 && (
              <div className="bang-act-screen bang-tour-payment-preview">
                <div className="bang-payment-card-layout">
                  <div className="bang-pay-header">
                    <CreditCard className="w-6 h-6 text-amber-400" />
                    <div>
                      <h4>Zero-Fee Razorpay Payment</h4>
                      <p>UPI (GPay / PhonePe / Paytm), Credit & Debit Cards</p>
                    </div>
                  </div>

                  <div className="bang-kds-timeline">
                    <div className="kds-step completed">
                      <span className="dot">✓</span>
                      <span>Order Paid</span>
                    </div>
                    <div className="kds-step active">
                      <span className="dot pulse">2</span>
                      <span>Kitchen Preparing</span>
                    </div>
                    <div className="kds-step">
                      <span className="dot">3</span>
                      <span>Ready for Pickup</span>
                    </div>
                  </div>

                  <div className="bang-secure-badge">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Socket.IO Live Alerts: Phone rings when order is ready</span>
                  </div>
                </div>
              </div>
            )}

            {/* ACT 5: THE CLIMAX — REAL COUNTER TOKEN & QR PICKUP */}
            {currentAct === 5 && (
              <div className="bang-act-screen bang-tour-token-preview">
                <div className="bang-counter-hero-card">
                  
                  <div ref={stampRef} className="bang-verified-stamp">
                    <Store className="w-4 h-4" />
                    <span>PRESENT AT REAL CAFE COUNTER</span>
                  </div>

                  <div className="bang-token-display">
                    <span className="token-label">YOUR COUNTER TOKEN</span>
                    <h1 className="token-digit">LR-842</h1>
                  </div>

                  <div className="bang-qr-plate">
                    <QRCodeSVG
                      value="https://laroche-intro.vercel.app/orders/LR-842"
                      size={120}
                      level="H"
                      includeMargin={true}
                      fgColor="#120e0b"
                      bgColor="#ffffff"
                    />
                    <span className="bang-qr-caption">Instant Counter Handover Pass</span>
                  </div>

                  <p className="bang-token-instruction">
                    Simply show this token screen at the counter to collect your fresh order without waiting in line!
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* Minimal 2-Level Kinetic Captions */}
          <div className="bang-kinetic-captions">
            <p className="bang-kicker">{activeZone.kicker}</p>
            <h2 className="bang-title">{activeZone.title}</h2>
          </div>

        </div>
      </div>

      {/* Cinematic Outro / Enter CTA */}
      <footer className="bang-bottom-hud">
        <button
          type="button"
          className="bang-enter-cta group"
          onClick={handleFinish}
          aria-label="Enter Cafe & Order"
        >
          <span>Enter Cafe & Order Now</span>
          <div className="bang-cta-arrow">
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </button>

        <div className="bang-timeline-rail">
          {TOUR_ZONES.map((zone) => (
            <button
              key={zone.id}
              type="button"
              onClick={() => jumpToAct(zone.id)}
              className={`bang-rail-segment ${currentAct >= zone.id ? 'active' : ''}`}
              title={zone.label}
            />
          ))}
        </div>
      </footer>
    </div>
  );
};

export default IntroVideo;
