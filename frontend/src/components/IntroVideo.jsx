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
  BellRing,
  QrCode,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import './IntroVideo.css';

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
  { id: 1, label: 'EXPLORE & MENU', icon: LayoutGrid, kicker: 'Campus Bistro App Tour', title: 'Interactive menu, search & live category rails' },
  { id: 2, label: 'CUSTOMIZE & CART', icon: ShoppingBag, kicker: 'Zero-Queue Preorder', title: 'Toppings, addons & 1-tap cart review' },
  { id: 3, label: 'INSTANT PAY & KDS', icon: CreditCard, kicker: 'Direct Kitchen Forwarding', title: 'Razorpay UPI & real-time kitchen status' },
  { id: 4, label: 'COUNTER TOKEN & QR', icon: Store, kicker: 'Skip The Pickup Line', title: 'Show your token at the cafe counter & collect hot' }
];

const IntroVideo = ({ onFinish }) => {
  const [fading, setFading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentAct, setCurrentAct] = useState(1);
  
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
      if (actNum === 4) playAudioBeep(987.77, 0.35, 'triangle', 0.18);
      else if (actNum === 3) playAudioBeep(784, 0.1, 'sine', 0.1);
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

    const tl = gsap.timeline({
      repeat: -1,
      defaults: { ease: "power3.inOut" }
    });
    timelineRef.current = tl;

    // ACT 1 (0.0s - 3.8s): THE BROWSE TOUR (Deep 3D push-through, search & Bento categories)
    tl.call(() => {
      jumpToAct(1);
    }, null, 0.1)
      .fromTo(camera, 
        { z: -160, rotationX: 5, rotationY: -6 }, 
        { z: 0, rotationX: 0, rotationY: 0, duration: 3.6, ease: "power2.out" }, 
        0
      )
      .fromTo(orb,
        { x: -160, y: -80, scale: 0.9 },
        { x: 160, y: 50, scale: 1.3, duration: 3.6, ease: "sine.inOut" },
        0
      );

    // ACT 2 (3.8s - 7.6s): DOLLY IN & PRE-ORDER CART WITH ADDONS
    tl.call(() => {
      jumpToAct(2);
    }, null, 3.8)
      .to(camera, { z: 80, rotationY: 6, rotationX: -3, duration: 3.6, ease: "power2.inOut" }, 3.8)
      .to(card, { rotationY: -5, rotationX: 2, duration: 3.6, ease: "power2.inOut" }, 3.8)
      .fromTo(".bang-tour-cart-preview", { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.4)" }, 4.0);

    // ACT 3 (7.6s - 11.2s): INSTANT RAZORPAY UPI & LIVE KITCHEN PIPELINE
    tl.call(() => {
      jumpToAct(3);
    }, null, 7.6)
      .to(camera, { z: 40, rotationY: -8, rotationX: 4, duration: 3.4, ease: "power3.inOut" }, 7.6)
      .to(card, { rotationY: 7, rotationX: -2, duration: 3.4, ease: "power3.inOut" }, 7.6)
      .fromTo(beam, { top: "-10%", opacity: 0 }, { top: "115%", opacity: 0.85, duration: 1.2, ease: "power1.inOut" }, 7.8)
      .fromTo(".bang-tour-payment-preview", { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 8.0);

    // ACT 4 (11.2s - 16.0s): THE CLIMAX — STAMP TOKEN AT REAL CAFE COUNTER
    tl.call(() => {
      jumpToAct(4);
    }, null, 11.2)
      .to(camera, { z: -10, rotationY: 0, rotationX: 0, duration: 2.2, ease: "elastic.out(1, 0.85)" }, 11.2)
      .to(card, { rotationY: 0, rotationX: 0, z: 0, duration: 2.2, ease: "elastic.out(1, 0.85)" }, 11.2)
      .fromTo(stamp, 
        { scale: 2.5, opacity: 0, rotation: -12, filter: "blur(8px)" }, 
        { scale: 1, opacity: 1, rotation: 0, filter: "blur(0px)", duration: 0.55, ease: "back.out(2)" }, 
        11.5
      )
      .fromTo(".bang-tour-token-preview", 
        { opacity: 0, scale: 0.9 }, 
        { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" }, 
        11.7
      );

    // Smooth reset
    tl.to(camera, { opacity: 0.95, duration: 0.6 }, 15.4);

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
          <span>La Roche • Developer Guided Tour</span>
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
                {/* Search Bar Simulation */}
                <div className="bang-search-interactive">
                  <Search className="w-4 h-4 text-amber-400" />
                  <span className="bang-search-text">Search artisan cappuccino, peri peri fries, waffles, pizza...</span>
                </div>

                {/* Categories Bento Grid */}
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

                {/* Bottom App Nav Preview */}
                <div className="bang-mock-bottom-nav">
                  <span className="nav-item active">☕ Menu</span>
                  <span className="nav-item">🗂️ Categories</span>
                  <span className="nav-item">🛍️ Cart (1)</span>
                  <span className="nav-item">📋 Orders</span>
                </div>
              </div>
            )}

            {/* ACT 2: CUSTOMIZE & PRE-ORDER CART */}
            {currentAct === 2 && (
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

                  {/* Addons Selection in Cart */}
                  <div className="bang-addons-selector">
                    <span className="bang-addon-chip selected">✓ Extra Espresso Shot (+₹30)</span>
                    <span className="bang-addon-chip selected">✓ Hazelnut Drizzle</span>
                    <span className="bang-addon-chip">Less Sugar</span>
                  </div>

                  {/* Checkout summary */}
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

            {/* ACT 3: INSTANT PAY & KITCHEN KDS PIPELINE */}
            {currentAct === 3 && (
              <div className="bang-act-screen bang-tour-payment-preview">
                <div className="bang-payment-card-layout">
                  <div className="bang-pay-header">
                    <CreditCard className="w-6 h-6 text-amber-400" />
                    <div>
                      <h4>Zero-Fee Razorpay Payment</h4>
                      <p>UPI (GPay / PhonePe / Paytm), Credit & Debit Cards</p>
                    </div>
                  </div>

                  {/* Live Kitchen KDS pipeline state tracker */}
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

            {/* ACT 4: THE CLIMAX — REAL COUNTER TOKEN & QR PICKUP */}
            {currentAct === 4 && (
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

                  {/* Scannable QR Pass */}
                  <div className="bang-qr-plate">
                    <QRCodeSVG
                      value="https://laroche-intro.vercel.app/orders/LR-842"
                      size={130}
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

          {/* Minimal 2-Level Kinetic Captions (Strict Anti-PPT Rules) */}
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
