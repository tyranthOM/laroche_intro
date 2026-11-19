import { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ArrowRight, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Coffee, 
  LogIn, 
  ShoppingBag, 
  CreditCard, 
  CheckCircle2, 
  QrCode, 
  Store, 
  ChevronRight, 
  ChevronLeft,
  Flame,
  Check,
  Search,
  Plus
} from 'lucide-react';
import './IntroVideo.css';

// Synthesize pleasant ambient micro-sounds using Web Audio API (zero extra assets)
const playSfx = (type) => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'chime') {
      // Counter bell
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(987.77, now); // B5
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'success') {
      // Payment success harmonic
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch (e) {
    // Audio autostart policy safe
  }
};

const STEPS = [
  {
    id: 'step-navigate',
    stepNumber: '01',
    badge: 'Step 1: Explore & Discover',
    title: 'Browse Menu & Categories',
    tagline: 'Search artisan dishes, pizza, pastas, cold beverages & bakery',
    icon: Search
  },
  {
    id: 'step-signin',
    stepNumber: '02',
    badge: 'Step 2: Instant Sign In',
    title: 'Quick Student / Mobile Sign In',
    tagline: 'Verify with 1-click Google or Student ID in seconds',
    icon: LogIn
  },
  {
    id: 'step-order',
    stepNumber: '03',
    badge: 'Step 3: Customize & Cart',
    title: 'Select Toppings & Place Order',
    tagline: 'Choose add-ons, extra cheese, drink sizes and review cart',
    icon: ShoppingBag
  },
  {
    id: 'step-pay',
    stepNumber: '04',
    badge: 'Step 4: Fast Digital Checkout',
    title: 'Pay with UPI, Cards or Netbanking',
    tagline: 'Zero-fee instant secure checkout via Razorpay',
    icon: CreditCard
  },
  {
    id: 'step-token',
    stepNumber: '05',
    badge: 'Step 5: Collect at Cafe Counter',
    title: 'Live QR Pass & Counter Token',
    tagline: 'Show your order token at the real counter to pick up fresh food!',
    icon: Store
  }
];

const IntroVideo = ({ onFinish }) => {
  const [fading, setFading] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [simCartCount, setSimCartCount] = useState(1);
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
    }
    setIsMuted(!isMuted);
  };

  const goToStep = (idx) => {
    setCurrentStep(idx);
    if (!isMuted) {
      if (idx === 4) playSfx('chime');
      else if (idx === 3) playSfx('success');
      else playSfx('click');
    }
  };

  const nextStep = (e) => {
    if (e) e.stopPropagation();
    if (currentStep < STEPS.length - 1) {
      goToStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const prevStep = (e) => {
    if (e) e.stopPropagation();
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  };

  // Auto-progress walkthrough every 4.8s
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        const next = (prev + 1) % STEPS.length;
        if (!isMuted) {
          if (next === 4) playSfx('chime');
          else if (next === 3) playSfx('success');
          else playSfx('click');
        }
        return next;
      });
    }, 4800);
    return () => clearInterval(timer);
  }, [isPaused, isMuted]);

  // Video Autoplay policy
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      videoRef.current.play().then(() => setIsVideoReady(true)).catch(() => {});
    }
  }, []);

  // Mobile touch gestures: horizontal swipes
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      setIsPaused(true);
    };

    const handleTouchEnd = (e) => {
      const diffX = startX - e.changedTouches[0].clientX;
      const diffY = startY - e.changedTouches[0].clientY;

      if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0) nextStep();
        else prevStep();
      } else if (diffY > 50 && Math.abs(diffY) > Math.abs(diffX)) {
        handleFinish();
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentStep]);

  const step = STEPS[currentStep];

  return (
    <div
      className={`intro-video-overlay ${fading ? 'fade-out' : ''}`}
      role="banner"
      aria-label="La Roche Interactive Walkthrough"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background B-Roll Cafe Atmosphere */}
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
      />

      {/* Cinematic Ambient Backdrop */}
      <div className="intro-backdrop-vignette" />
      <div className="intro-light-glow" />

      {/* Top Header Navigation */}
      <header className="intro-top-bar">
        <div className="intro-pill-badge">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span>Interactive App Tour</span>
        </div>

        <div className="intro-top-actions">
          <button
            type="button"
            className="intro-glass-icon-btn"
            onClick={toggleSound}
            aria-label={isMuted ? 'Turn Sound FX On' : 'Turn Sound FX Off'}
            title={isMuted ? 'Muted' : 'Sound Effects Active'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-300" />}
          </button>

          <button
            type="button"
            className="intro-skip-pill-btn"
            onClick={handleFinish}
          >
            Skip Tour
          </button>
        </div>
      </header>

      {/* Main Walkthrough Presentation Stage */}
      <main className="intro-walkthrough-stage">
        {/* Step Progress Tracker */}
        <div className="intro-step-stepper">
          {STEPS.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goToStep(idx)}
              className={`intro-stepper-item ${idx === currentStep ? 'active' : ''} ${idx < currentStep ? 'completed' : ''}`}
            >
              <div className="intro-stepper-num">
                {idx < currentStep ? <Check className="w-3 h-3" /> : idx + 1}
              </div>
              <span className="intro-stepper-label">{s.stepNumber}</span>
            </button>
          ))}
        </div>

        {/* Dynamic Simulated Device / Screen View */}
        <div className="intro-device-mockup">
          {/* Animated Mockup Phone Screen based on active step */}
          <div className="mockup-screen-inner">
            {/* STEP 1: BROWSE & CATEGORIES */}
            {currentStep === 0 && (
              <div className="mockup-view animate-fade-in">
                <div className="mockup-header-search">
                  <Search className="w-3.5 h-3.5 text-amber-300" />
                  <span>Search "Paneer Tikka Pizza", "Latte"...</span>
                </div>
                <div className="mockup-category-scroll">
                  <div className="mockup-cat-chip active">🍕 Pizza</div>
                  <div className="mockup-cat-chip">☕ Coffee</div>
                  <div className="mockup-cat-chip">🍟 Bites</div>
                  <div className="mockup-cat-chip">🧇 Waffles</div>
                </div>
                <div className="mockup-food-card-preview">
                  <img src="/menu-items/1_peri_peri_fries.jpg" alt="Dish" className="mockup-food-img" onError={(e)=>{e.target.src='/logo.png';}} />
                  <div className="mockup-food-info">
                    <h4>Artisan Peri Peri Fries</h4>
                    <p className="price">₹120 <span className="badge">Bestseller</span></p>
                  </div>
                  <button className="mockup-add-btn" onClick={() => setSimCartCount(simCartCount + 1)}>
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: INSTANT SIGN IN */}
            {currentStep === 1 && (
              <div className="mockup-view animate-fade-in mockup-center-box">
                <div className="mockup-auth-logo">
                  <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
                </div>
                <h4 className="mockup-auth-title">Welcome to La Roche</h4>
                <p className="mockup-auth-sub">Sign in with campus email or phone</p>
                <div className="mockup-input-sim">
                  <span>student@campus.edu</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="mockup-google-btn-sim">
                  <LogIn className="w-3.5 h-3.5" /> Continue with Google
                </div>
              </div>
            )}

            {/* STEP 3: CUSTOMIZE & CART */}
            {currentStep === 2 && (
              <div className="mockup-view animate-fade-in">
                <div className="mockup-cart-header">
                  <span>My Pre-Order Cart</span>
                  <span className="cart-badge-count">{simCartCount} Items</span>
                </div>
                <div className="mockup-cart-item">
                  <Coffee className="w-5 h-5 text-amber-400" />
                  <div className="mockup-item-text">
                    <h5>Hazelnut Cappuccino</h5>
                    <p>+ Extra Shot • Oat Milk</p>
                  </div>
                  <span className="mockup-price">₹170</span>
                </div>
                <div className="mockup-addon-selection">
                  <span className="addon-tag active">✓ Extra Foam</span>
                  <span className="addon-tag active">✓ Less Sugar</span>
                </div>
                <div className="mockup-cart-footer">
                  <span>Total Amount</span>
                  <strong>₹170</strong>
                </div>
              </div>
            )}

            {/* STEP 4: INSTANT SECURE PAYMENT */}
            {currentStep === 3 && (
              <div className="mockup-view animate-fade-in mockup-center-box">
                <div className="mockup-payment-pulse">
                  <CreditCard className="w-7 h-7 text-amber-400 animate-bounce" />
                </div>
                <h4 className="mockup-pay-title">Instant UPI & Online Pay</h4>
                <div className="mockup-pay-methods">
                  <span className="pay-chip active">GPay</span>
                  <span className="pay-chip active">PhonePe</span>
                  <span className="pay-chip active">Paytm</span>
                  <span className="pay-chip active">Cards</span>
                </div>
                <div className="mockup-success-pill">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Payment Verified: ₹170</span>
                </div>
              </div>
            )}

            {/* STEP 5: QR PASS & COUNTER PICKUP */}
            {currentStep === 4 && (
              <div className="mockup-view animate-fade-in mockup-token-view">
                <div className="counter-token-badge">
                  <Store className="w-4 h-4 text-amber-300" />
                  <span>PRESENT AT REAL CAFE COUNTER</span>
                </div>
                <div className="counter-token-number">
                  TOKEN #LR-842
                </div>
                <div className="mockup-qr-box">
                  <QRCodeSVG
                    value="https://laroche-intro.vercel.app/orders/LR-842"
                    size={105}
                    level="M"
                    fgColor="#1c1917"
                    bgColor="#ffffff"
                    includeMargin={true}
                  />
                  <span className="qr-counter-note">Ready for Instant Pickup</span>
                </div>
                <div className="counter-status-ribbon">
                  <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>Fresh & Prepared • Skip The Line</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Text Explanation Card for Current Step */}
        <div className="intro-step-description-card">
          <div className="intro-card-step-badge">
            <step.icon className="w-4 h-4 text-amber-400" />
            <span>{step.badge}</span>
          </div>

          <h2 className="intro-step-title">{step.title}</h2>
          <p className="intro-step-tagline">{step.tagline}</p>

          {/* Step Dots for quick clicking */}
          <div className="intro-step-bullets">
            {STEPS.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                className={`intro-bullet ${idx === currentStep ? 'active' : ''}`}
                onClick={() => goToStep(idx)}
                aria-label={`Step ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Action Navigation */}
      <footer className="intro-bottom-action">
        <div className="intro-actions-row">
          {currentStep > 0 && (
            <button
              type="button"
              className="intro-secondary-btn"
              onClick={prevStep}
              aria-label="Previous step"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}

          <button
            type="button"
            className="intro-cta-button group"
            onClick={nextStep}
            aria-label={currentStep === STEPS.length - 1 ? "Enter Cafe & Order" : "Next Step"}
          >
            <span className="intro-cta-text">
              {currentStep === STEPS.length - 1 ? 'Start Ordering Now' : 'Next: ' + STEPS[(currentStep + 1) % STEPS.length].badge.split(':')[0]}
            </span>
            <span className="intro-cta-icon-wrapper">
              {currentStep === STEPS.length - 1 ? (
                <Store className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              )}
            </span>
          </button>
        </div>

        <p className="intro-hint-text">
          <span>Swipe left / right to navigate steps • Tap 'Start Ordering Now' anytime</span>
        </p>
      </footer>
    </div>
  );
};

export default IntroVideo;
