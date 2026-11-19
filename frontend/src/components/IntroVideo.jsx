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
  ArrowRight
} from 'lucide-react';
import './IntroVideo.css';

// Crisp mechanical audio synthesis (counter bell & micro-clicks)
const playAudioBeep = (freq = 600, duration = 0.08, type = 'sine', gainVal = 0.1) => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  } catch (e) {
    // audio policy safe
  }
};

const IntroVideo = ({ onFinish }) => {
  const [fading, setFading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentAct, setCurrentAct] = useState(1);
  
  const containerRef = useRef(null);
  const cameraRigRef = useRef(null);
  const videoRef = useRef(null);
  const lightOrbRef = useRef(null);

  // continuous 3D world anchors
  const cardRigRef = useRef(null);
  const textKickerRef = useRef(null);
  const textTitleRef = useRef(null);
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

  useEffect(() => {
    const camera = cameraRigRef.current;
    const card = cardRigRef.current;
    const kicker = textKickerRef.current;
    const title = textTitleRef.current;
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

    // ACT 1 (0.0s - 3.2s): THE BROWSE HOOK (Camera floats in with gentle cinematic tilt)
    tl.call(() => {
      setCurrentAct(1);
      if (!isMuted) playAudioBeep(520, 0.08, 'sine', 0.08);
    }, null, 0.1)
      .fromTo(camera, 
        { z: -180, rotationX: 8, rotationY: -12 }, 
        { z: 0, rotationX: 0, rotationY: 0, duration: 3.2, ease: "power2.out" }, 
        0
      )
      .fromTo(orb,
        { x: -120, y: -60, scale: 0.8 },
        { x: 140, y: 40, scale: 1.2, duration: 3.2, ease: "sine.inOut" },
        0
      )
      .fromTo(kicker, { opacity: 0, y: 15, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.8 }, 0.3)
      .fromTo(title, { opacity: 0, y: 20, filter: "blur(8px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1 }, 0.5);

    // ACT 2 (3.2s - 6.6s): DOLLY IN & PRE-ORDER CART (Continuous 3D camera travel)
    tl.call(() => {
      setCurrentAct(2);
      if (!isMuted) playAudioBeep(680, 0.06, 'triangle', 0.1);
    }, null, 3.2)
      .to(kicker, { opacity: 0, y: -10, filter: "blur(4px)", duration: 0.4 }, 3.2)
      .to(title, { opacity: 0, y: -15, filter: "blur(6px)", duration: 0.5 }, 3.2)
      .to(camera, { z: 120, rotationY: 10, rotationX: -4, duration: 3.4, ease: "power2.inOut" }, 3.2)
      .to(card, { rotationY: -8, rotationX: 4, duration: 3.4, ease: "power2.inOut" }, 3.2)
      .fromTo(".act-cart-preview", { opacity: 0, scale: 0.9, z: -40 }, { opacity: 1, scale: 1, z: 20, duration: 0.8, ease: "back.out(1.5)" }, 3.5);

    // ACT 3 (6.6s - 10.0s): WHIP PAN TO INSTANT CHECKOUT (Beam slice across 3D canvas)
    tl.call(() => {
      setCurrentAct(3);
      if (!isMuted) playAudioBeep(880, 0.12, 'sine', 0.12);
    }, null, 6.6)
      .to(camera, { z: 50, rotationY: -14, rotationX: 6, duration: 3.4, ease: "power3.inOut" }, 6.6)
      .to(card, { rotationY: 12, rotationX: -3, duration: 3.4, ease: "power3.inOut" }, 6.6)
      .fromTo(beam, { top: "-10%", opacity: 0 }, { top: "110%", opacity: 0.8, duration: 1.4, ease: "power1.inOut" }, 6.8)
      .fromTo(".act-payment-preview", { opacity: 0, y: 25 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, 7.0);

    // ACT 4 (10.0s - 14.5s): THE CLIMAX — STAMP TOKEN AT REAL CAFE COUNTER
    tl.call(() => {
      setCurrentAct(4);
      if (!isMuted) {
        playAudioBeep(987.77, 0.4, 'triangle', 0.2); // Counter bell chime
      }
    }, null, 10.0)
      .to(camera, { z: -30, rotationY: 0, rotationX: 0, duration: 2.5, ease: "elastic.out(1, 0.85)" }, 10.0)
      .to(card, { rotationY: 0, rotationX: 0, z: 0, duration: 2.2, ease: "elastic.out(1, 0.85)" }, 10.0)
      .fromTo(stamp, 
        { scale: 2.8, opacity: 0, rotation: -18, filter: "blur(12px)" }, 
        { scale: 1, opacity: 1, rotation: 0, filter: "blur(0px)", duration: 0.65, ease: "back.out(2)" }, 
        10.4
      )
      .fromTo(".act-qr-token-stage", 
        { opacity: 0, scale: 0.85, z: -30 }, 
        { opacity: 1, scale: 1, z: 30, duration: 0.8, ease: "power2.out" }, 
        10.6
      )
      .to(card, { y: -8, duration: 2, yoyo: true, repeat: 1, ease: "sine.inOut" }, 11.2);

    // Smooth reset transition back to Act 1
    tl.to(camera, { opacity: 0.9, duration: 0.5 }, 14.0);

    // Hidden Controls: Space to pause/resume, R to restart (Bang Motion spec)
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

  return (
    <div
      ref={containerRef}
      className={`bang-motion-viewport ${fading ? 'fade-out' : ''}`}
      role="banner"
      aria-label="La Roche Cafe Cinematic Opener"
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
          <span>La Roche • Campus Bistro</span>
        </div>

        <div className="bang-hud-right">
          <button
            type="button"
            className="bang-icon-btn"
            onClick={toggleSound}
            aria-label={isMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
            title={isMuted ? 'Muted' : 'Sound Effects Active'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-300" />}
          </button>

          <button
            type="button"
            className="bang-skip-btn"
            onClick={handleFinish}
          >
            Skip Intro
          </button>
        </div>
      </header>

      {/* 3D Camera Rig & World Container */}
      <div className="bang-world-container">
        <div ref={cameraRigRef} className="bang-camera-rig">
          
          {/* Ongoing Visual Anchor: Living 3D Canvas Card */}
          <div ref={cardRigRef} className="bang-anchor-card">
            
            {/* Laser scanning beam */}
            <div ref={scanBeamRef} className="bang-scan-beam" />

            {/* Continuous Header on the 3D Canvas */}
            <div className="bang-card-topbar">
              <div className="bang-logo-wrap">
                <img src="/logo.png" alt="La Roche" className="bang-logo-img" />
              </div>
              <div className="bang-live-state-pill">
                <span className="bang-pulse-dot" />
                <span>
                  {currentAct === 1 && 'ACT I : EXPLORE MENU'}
                  {currentAct === 2 && 'ACT II : PRE-ORDER CART'}
                  {currentAct === 3 && 'ACT III : INSTANT CHECKOUT'}
                  {currentAct === 4 && 'CLIMAX : COUNTER TOKEN'}
                </span>
              </div>
            </div>

            {/* ACT 1: Browse Dynamic Representation */}
            {currentAct === 1 && (
              <div className="bang-act-scene">
                <div className="bang-search-motion-bar">
                  <Search className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span className="bang-typing-text">Search artisan cappuccino, peri peri fries, waffles...</span>
                </div>
                <div className="bang-food-row">
                  <div className="bang-food-chip highlight">
                    <Coffee className="w-3.5 h-3.5 text-amber-400" />
                    <span>Hazelnut Latte</span>
                  </div>
                  <div className="bang-food-chip">
                    <span>🍕 Stone Oven Pizza</span>
                  </div>
                  <div className="bang-food-chip">
                    <span>🍟 Crispy Bites</span>
                  </div>
                </div>
              </div>
            )}

            {/* ACT 2: Customize & Order */}
            {currentAct === 2 && (
              <div className="bang-act-scene act-cart-preview">
                <div className="bang-cart-item-block">
                  <Coffee className="w-6 h-6 text-amber-400" />
                  <div className="bang-cart-details">
                    <h4>Artisan Hazelnut Cappuccino</h4>
                    <p>+ Extra Shot • Velvety Oat Milk</p>
                  </div>
                  <span className="bang-cart-val">₹170</span>
                </div>
                <div className="bang-badge-row">
                  <span className="bang-mini-tag">✓ Customized</span>
                  <span className="bang-mini-tag">⚡ 0-Minute Queue</span>
                </div>
              </div>
            )}

            {/* ACT 3: Razorpay / UPI Instant Checkout */}
            {currentAct === 3 && (
              <div className="bang-act-scene act-payment-preview">
                <div className="bang-pay-flow">
                  <CreditCard className="w-7 h-7 text-amber-400" />
                  <div className="bang-pay-info">
                    <h4>Instant UPI & Card Checkout</h4>
                    <p>Zero wait time • Direct Kitchen Forwarding</p>
                  </div>
                </div>
                <div className="bang-pay-badge-verified">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Verified & Sent to Kitchen KDS</span>
                </div>
              </div>
            )}

            {/* ACT 4: The Climax — Real Counter Token & QR Pass */}
            {currentAct === 4 && (
              <div className="bang-act-scene act-qr-token-stage">
                <div ref={stampRef} className="bang-climax-stamp">
                  <Store className="w-4 h-4" />
                  <span>READY FOR PICKUP</span>
                </div>
                <div className="bang-token-big">TOKEN #LR-842</div>
                <div className="bang-qr-surface">
                  <QRCodeSVG
                    value="https://laroche-intro.vercel.app/orders/LR-842"
                    size={96}
                    level="H"
                    includeMargin={true}
                    fgColor="#120e0b"
                    bgColor="#ffffff"
                  />
                  <span className="bang-qr-note">Present at Cafe Counter</span>
                </div>
              </div>
            )}

          </div>

          {/* Minimal 2-level kinetic text below 3D canvas (Anti-PPT Law) */}
          <div className="bang-kinetic-captions">
            <p ref={textKickerRef} className="bang-kicker">
              {currentAct === 1 && 'Zero Waiting Campus Bistro'}
              {currentAct === 2 && 'Personalized Ahead of Time'}
              {currentAct === 3 && 'Instant Online Pay'}
              {currentAct === 4 && 'Skip The Counter Queue'}
            </p>
            <h2 ref={textTitleRef} className="bang-title">
              {currentAct === 1 && 'Pre-order artisan food right from your seat'}
              {currentAct === 2 && 'Customize toppings and review order cart'}
              {currentAct === 3 && 'Pay securely via UPI, cards or netbanking'}
              {currentAct === 4 && 'Flash token at the counter and collect hot'}
            </h2>
          </div>

        </div>
      </div>

      {/* Cinematic Outro / Enter CTA */}
      <footer className="bang-bottom-hud">
        <button
          type="button"
          className="bang-enter-cta group"
          onClick={handleFinish}
          aria-label="Enter Cafe"
        >
          <span>Enter Cafe & Order</span>
          <div className="bang-cta-arrow">
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </button>

        <div className="bang-timeline-rail">
          {[1, 2, 3, 4].map((actNum) => (
            <div
              key={actNum}
              className={`bang-rail-segment ${currentAct >= actNum ? 'active' : ''}`}
            />
          ))}
        </div>
      </footer>
    </div>
  );
};

export default IntroVideo;
