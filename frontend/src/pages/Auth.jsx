import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import { Smartphone, Mail, Lock, User as UserIcon, ArrowRight, ArrowLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import {
  login as loginService,
  signup as signupService,
  googleLogin as googleLoginService,
  updatePhone as updatePhoneService,
  updateProfile as updateProfileService,
  forgotPassword as forgotPasswordService,
  verifyResetOtp as verifyResetOtpService,
  resetPassword as resetPasswordService,
} from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import SEO from '../components/SEO';
import {
  isValidPhoneNumber,
  isValidOtp,
  validateLoginForm,
} from '../utils/validators';
import './Auth.css';

// Custom Google 'G' SVG Logo
const GoogleIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

const Auth = ({ initialMode = 'login' }) => {
  const searchParams = useSearchParams()[0];
  const navigate = useNavigate();
  const location = useLocation();
  const { login, updateUser } = useAuth();
  const { isDark } = useTheme();

  // Mode: 'login' | 'signup' | 'forgot'
  const isSignupRoute = location.pathname === '/signup' || initialMode === 'signup';
  const [mode, setMode] = useState(isSignupRoute ? 'signup' : 'login');

  // Post-Sign-In Mandatory Name Collection State (required for kitchen counter pickup)
  const [postAuthPending, setPostAuthPending] = useState(null);
  const [postAuthName, setPostAuthName] = useState('');

  // Email Sign In States & Password Visibility
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Dedicated Create Account States (Name, Phone, Email, Password)
  const [signupData, setSignupData] = useState({
    name: '',
    phone: searchParams.get('phone') || '',
    email: '',
    password: '',
  });

  // Forgot Password States (3-Step Dedicated Flow)
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotStep, setForgotStep] = useState('enter_email'); // 'enter_email' | 'enter_otp' | 'enter_new_password'
  const [forgotCountdown, setForgotCountdown] = useState(0);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Status & Feedback
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const otpInputRef = useRef(null);

  // Sync route changes
  useEffect(() => {
    if (location.pathname === '/signup') {
      setMode('signup');
    } else if (location.pathname === '/login') {
      setMode('login');
    }
    setErrors({});
    setServerError('');
    const queryPhone = searchParams.get('phone');
    if (queryPhone) {
      setSignupData((prev) => ({ ...prev, phone: queryPhone }));
      if (searchParams.get('notice') === 'not_found') {
        setServerError(`No account found for +91 ${queryPhone}. Please complete registration below.`);
      }
    }
  }, [location.pathname, searchParams]);

  // Countdown timer for forgot password
  useEffect(() => {
    let timer;
    if (forgotCountdown > 0) {
      timer = setTimeout(() => setForgotCountdown(forgotCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [forgotCountdown]);

  const handlePostAuthRedirect = (data) => {
    login(data);
    const redirectParam = searchParams.get('redirect');
    if (redirectParam) {
      navigate(redirectParam);
    } else if (data.user?.role === 'kitchen') {
      navigate('/kitchen/dashboard');
    } else if (data.user?.role === 'cms') {
      navigate('/cms/dashboard');
    } else {
      navigate('/menu');
    }
  };

  // Check if Google Client ID is configured
  const rawClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '241648587834-i2usudn3sdi0b8sgoavritp7pbqdke1h.apps.googleusercontent.com';
  const isGoogleConfigured = Boolean(
    rawClientId &&
    !rawClientId.includes('dummy') &&
    !rawClientId.includes('your_google') &&
    !rawClientId.includes('pending')
  );

  // Safely initialize useGoogleLogin hook
  let triggerGoogleLogin = null;
  try {
    triggerGoogleLogin = useGoogleLogin({
      onSuccess: async (tokenResponse) => {
        setServerError('');
        setSuccessMessage('');
        setLoading(true);
        try {
          const data = await googleLoginService({ accessToken: tokenResponse.access_token });
          login(data);

          // If user already has a name stored in MongoDB or Google profile, log them straight in!
          // Only prompt if the name is completely missing or empty.
          const hasValidName = data.user?.name && data.user.name.trim().length >= 2;
          if (hasValidName) {
            handlePostAuthRedirect(data);
          } else {
            setPostAuthPending(data);
            setPostAuthName('');
          }
        } catch (err) {
          setServerError(err.response?.data?.message || 'Google authentication failed. Please try again.');
        } finally {
          setLoading(false);
        }
      },
      onError: (errorResponse) => {
        console.warn('Google login dismissed or failed:', errorResponse);
        setServerError('Google Sign-In was cancelled or encountered an error.');
      },
    });
  } catch (err) {
    triggerGoogleLogin = null;
  }

  // Handle customer name submission after sign in
  const handleSavePostAuthName = async (e) => {
    if (e) e.preventDefault();
    setServerError('');
    setSuccessMessage('');

    const cleanName = postAuthName.trim();
    if (!cleanName || cleanName.length < 2) {
      setErrors({ postAuthName: 'Please enter your name (at least 2 characters)' });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await updateProfileService({ name: cleanName });
    } catch (err) {
      console.warn('Backend profile name sync notice:', err?.message);
    }

    // Always update client-side session so customer is never blocked
    updateUser({ name: cleanName });
    const updatedData = {
      ...postAuthPending,
      user: {
        ...postAuthPending.user,
        name: cleanName,
      },
    };
    handlePostAuthRedirect(updatedData);
    setLoading(false);
  };

  const handleGoogleButtonClick = () => {
    setServerError('');
    setSuccessMessage('');

    // Google OAuth strictly forbids raw public IP addresses in Authorized JavaScript Origins
    const isRawIpAddress =
      typeof window !== 'undefined' &&
      /^\d{1,3}(\.\d{1,3}){3}$/.test(window.location.hostname) &&
      !['127.0.0.1', 'localhost'].includes(window.location.hostname);

    if (isRawIpAddress) {
      setServerError(
        `Google blocks OAuth logins from raw IP addresses (${window.location.hostname}). Please use Mobile OTP or Email below to sign in, or connect via a domain/DuckDNS.`
      );
      return;
    }

    if (!isGoogleConfigured || !triggerGoogleLogin) {
      setServerError(
        'Google Sign-In is ready! Set VITE_GOOGLE_CLIENT_ID in your environment variables to connect live Google accounts. In the meantime, please sign in with Mobile OTP or Email below.'
      );
      return;
    }
    triggerGoogleLogin();
  };

  // ---------------- EMAIL SIGN IN FLOW ----------------
  const handleEmailLoginSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const submissionData = {
      email: loginData.email.trim(),
      password: loginData.password,
    };

    const validationErrors = validateLoginForm(submissionData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const data = await loginService(submissionData);
      handlePostAuthRedirect(data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 404) {
        setServerError('Invalid credentials. If you are a new customer, please create an account.');
      } else {
        setServerError(err.response?.data?.message || 'Login failed. Please verify email and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------------- DEDICATED CREATE ACCOUNT FLOW ----------------
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const cleanPhone = signupData.phone.replace(/\D/g, '');
    const cleanName = signupData.name.trim();
    const cleanEmail = signupData.email.trim().toLowerCase();
    const password = signupData.password;

    const newErrors = {};
    if (!cleanName) newErrors.name = 'Full name is required';
    if (!isValidPhoneNumber(cleanPhone)) newErrors.phone = 'Valid 10-digit phone number is required';
    if (!cleanEmail || !cleanEmail.includes('@')) newErrors.email = 'Valid email address is required';
    if (!password || password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const data = await signupService({
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        password,
      });
      handlePostAuthRedirect(data);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Account creation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ---------------- FORGOT PASSWORD FLOW (3-STEP) ----------------
  // Step 1: Send OTP to email
  const handleForgotPasswordSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setServerError('');
    setSuccessMessage('');

    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrors({ forgotEmail: 'Please enter a valid registered email' });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await forgotPasswordService({ email: cleanEmail });
      setForgotStep('enter_otp');
      setForgotOtp('');
      setForgotCountdown(45);
      setSuccessMessage(`A 6-digit verification code has been sent to ${cleanEmail}.`);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to send reset code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP code first
  const handleVerifyResetOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setServerError('');
    setSuccessMessage('');

    const cleanEmail = forgotEmail.trim().toLowerCase();
    const cleanOtp = forgotOtp.trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      setErrors({ forgotOtp: 'Please enter the 6-digit verification code' });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await verifyResetOtpService({ email: cleanEmail, otp: cleanOtp });
      setForgotStep('enter_new_password');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
      setSuccessMessage('Code verified! Please create your new password below.');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Invalid or expired verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set New Password & Sign In
  const handleResetPasswordSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setServerError('');
    setSuccessMessage('');

    const cleanEmail = forgotEmail.trim().toLowerCase();
    const cleanOtp = forgotOtp.trim();

    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setErrors({ forgotNewPassword: 'Password must be at least 6 characters' });
      return;
    }

    if (forgotConfirmPassword && forgotNewPassword !== forgotConfirmPassword) {
      setErrors({ forgotConfirmPassword: 'Passwords do not match' });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const data = await resetPasswordService({
        email: cleanEmail,
        otp: cleanOtp,
        newPassword: forgotNewPassword,
      });
      handlePostAuthRedirect(data);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Password reset failed. Code may have expired.');
    } finally {
      setLoading(false);
    }
  };

  const searchParamStr = searchParams.toString() ? `?${searchParams.toString()}` : '';

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-transparent dark:bg-[#1A1A14] transition-colors duration-300">
      <SEO
        title={mode === 'signup' ? 'Create Customer Account | La Roche Cafe' : 'Customer Login | La Roche Cafe'}
        description="Sign in or register for online preordering, quick payments, and live counter pickup alerts at La Roche Cafe."
        robots="noindex, follow"
      />
      <div className="w-full max-w-md bg-[#FFF9EC] dark:bg-[#23231C] rounded-3xl border border-[#ECD5A5] dark:border-[#3D3D30] shadow-warm-xl p-6 sm:p-8 relative overflow-hidden transition-colors duration-300">
        
        {/* Brand Logo Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-block mb-3">
            <img
              src={isDark ? "/logo.png" : "/logo2.png"}
              alt="La Roche Cafe"
              className="h-12 w-auto mx-auto object-contain transition-transform duration-300"
            />
          </Link>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#2A2A22] dark:text-white tracking-tight">
            {postAuthPending
              ? "What's your name?"
              : mode === 'signup'
              ? 'Create Customer Account'
              : mode === 'forgot'
              ? forgotStep === 'enter_otp'
                ? 'Verify Reset Code'
                : forgotStep === 'enter_new_password'
                ? 'Create New Password'
                : 'Reset Password'
              : 'Sign In'}
          </h2>
          <p className="text-xs sm:text-sm text-[#5A5748] dark:text-[#C4BFB2] mt-1.5 font-sans">
            {postAuthPending
              ? 'Just your name so we know who to call when your food is ready at the counter.'
              : mode === 'signup'
              ? 'Join La Roche Cafe for quick ordering & instant counter pickup'
              : mode === 'forgot'
              ? forgotStep === 'enter_otp'
                ? 'Enter the 6-digit verification code sent to your email'
                : forgotStep === 'enter_new_password'
                ? 'Set a new password for your account'
                : 'Enter your email to receive a password reset code'
              : 'Sign in to order your favorite coffee & fresh bites'}
          </p>
        </div>

        {/* Server Feedback Alerts */}
        {serverError && (
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs font-medium mb-5 leading-relaxed">
            {serverError}
          </div>
        )}
        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium mb-5">
            {successMessage}
          </div>
        )}

        {/* =========================================================================
            0. SIGN-IN NAME STEP (CLEAN, WARM, ARTISANAL DOODLE & MINIMAL INPUT)
           ========================================================================= */}
        {postAuthPending ? (
          <div className="space-y-5 animate-fadeIn">
            {/* Handcrafted Warm Cafe Doodle Illustration */}
            <div className="flex flex-col items-center justify-center py-3 text-center">
              <div className="w-20 h-20 rounded-full bg-[#FFF3DC] dark:bg-[#2C241E] border border-[#ECD5A5] dark:border-[#4A3B32] shadow-warm-sm flex items-center justify-center text-[#A6472B] dark:text-[#F7D070] mb-2.5">
                <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-11 h-11 stroke-current stroke-[2.2] stroke-linecap-round stroke-linejoin-round">
                  {/* Steaming Coffee Cup Doodle */}
                  <path d="M14 26h28v14a14 14 0 0 1-14 14h0A14 14 0 0 1 14 40V26z" />
                  <path d="M42 30h5a5 5 0 0 1 0 10h-5" />
                  {/* Saucer */}
                  <path d="M10 54h36" />
                  {/* Steam swirls */}
                  <path d="M22 18c0-3 3-4 3-7" />
                  <path d="M28 20c0-4 4-5 4-9" />
                  <path d="M34 18c0-3 3-4 3-7" />
                  {/* Sparkle accents */}
                  <circle cx="48" cy="18" r="1.5" fill="currentColor" />
                  <circle cx="12" cy="19" r="1" fill="currentColor" />
                </svg>
              </div>
              <p className="text-xs font-serif italic text-taupe dark:text-stone-400">
                Fresh brews, pressed toasties &amp; friendly smiles.
              </p>
            </div>

            <form onSubmit={handleSavePostAuthName} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#5A5748] dark:text-[#DDD8CB] mb-1.5">
                  Your Name <span className="text-[#A6472B] font-black">*</span>
                </label>
                <div className="flex items-center rounded-2xl border border-[#ECD5A5] dark:border-[#3D3D30] bg-[#FFF9EC] dark:bg-[#2F2F26] overflow-hidden focus-within:border-[#A6472B] focus-within:ring-2 focus-within:ring-[#A6472B]/20 transition-all px-3.5 py-1">
                  <UserIcon className="w-4 h-4 text-[#8D5B4C] mr-2 shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    required
                    className="w-full py-2.5 bg-transparent text-[#2A2A22] dark:text-white placeholder:text-[#5A5748]/60 dark:placeholder:text-[#C4BFB2]/60 text-sm font-semibold focus:outline-none"
                    placeholder="e.g. Ranjeet"
                    value={postAuthName}
                    onChange={(e) => {
                      setPostAuthName(e.target.value);
                      if (errors.postAuthName) setErrors({});
                    }}
                  />
                </div>
                {errors.postAuthName ? (
                  <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.postAuthName}</p>
                ) : (
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1.5">
                    That's all we need to get your food cooking.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !postAuthName.trim() || postAuthName.trim().length < 2}
                className="w-full py-3.5 rounded-full bg-[#A6472B] hover:bg-[#7E351F] text-white font-bold text-sm tracking-wide shadow-warm-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
              >
                <span>{loading ? 'Saving...' : 'Dive into the Menu'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* =========================================================================
                1. SIGN IN VIEW (/login)
               ========================================================================= */}
            {mode === 'login' && (
              <div>
                {/* Bespoke Google Fast Sign-In */}
                <button
              type="button"
              onClick={handleGoogleButtonClick}
              disabled={loading}
              className="w-full py-3 px-4 rounded-full border border-[#ECD5A5] dark:border-[#3D3D30] bg-[#FFF9EC] hover:bg-[#F9EAC7] dark:bg-[#2F2F26] dark:hover:bg-[#3D3D30] text-[#2A2A22] dark:text-white font-bold text-xs sm:text-sm shadow-warm-sm hover:shadow-warm-md transition-all flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-50"
            >
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-5">
              <div className="border-t border-[#ECD5A5] dark:border-[#3D3D30] w-full"></div>
              <span className="bg-[#FFF9EC] dark:bg-[#23231C] px-3 text-[11px] font-bold text-[#5A5748] dark:text-[#C4BFB2] uppercase tracking-wider">
                or 
              </span>
              <div className="border-t border-[#ECD5A5] dark:border-[#3D3D30] w-full"></div>
            </div>

            {/* Direct Email & Password Sign In (Phone OTP removed completely) */}
            <form onSubmit={handleEmailLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#5A5748] dark:text-[#DDD8CB] mb-1.5">Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-[#5A5748] dark:text-[#C4BFB2] absolute left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    name="email"
                    className="w-full h-11 pl-10 pr-4 rounded-2xl border border-[#ECD5A5] dark:border-[#3D3D30] bg-[#FFF9EC] dark:bg-[#2F2F26] text-[#2A2A22] dark:text-white placeholder:text-[#5A5748]/70 dark:placeholder:text-[#C4BFB2]/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#A6472B] focus:ring-2 focus:ring-[#A6472B]/20 transition-all"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    placeholder="Enter your email"
                    autoComplete="email"
                  />
                </div>
                {errors.email && <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.email}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#5A5748] dark:text-[#DDD8CB]">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setServerError('');
                      setSuccessMessage('');
                      setForgotStep('enter_email');
                      setForgotEmail('');
                      setForgotOtp('');
                      setForgotNewPassword('');
                    }}
                    className="text-xs font-bold text-[#A6472B] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-[#5A5748] dark:text-[#C4BFB2] absolute left-3.5 pointer-events-none" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    name="password"
                    className="w-full h-11 pl-10 pr-11 rounded-2xl border border-[#ECD5A5] dark:border-[#3D3D30] bg-[#FFF9EC] dark:bg-[#2F2F26] text-[#2A2A22] dark:text-white placeholder:text-[#5A5748]/70 dark:placeholder:text-[#C4BFB2]/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#A6472B] focus:ring-2 focus:ring-[#A6472B]/20 transition-all"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 text-[#5A5748] hover:text-[#2A2A22] dark:text-[#C4BFB2] dark:hover:text-white transition-colors"
                    title={showLoginPassword ? 'Hide password' : 'Show password'}
                    aria-label="Toggle password visibility"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full bg-[#A6472B] hover:bg-[#7E351F] text-white font-bold text-sm shadow-warm-md transition-all disabled:opacity-50 mt-2"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            {/* Prominent Link to Create Account */}
            <div className="mt-8 pt-5 border-t border-[#DDD4C0] dark:border-[#3D3D30] text-center">
              <p className="text-xs text-[#5A5748] dark:text-[#DDD8CB] mb-2">New User?</p>
              <Link
                to={`/signup${searchParamStr}`}
                className="inline-flex items-center justify-center gap-1.5 w-full py-3 rounded-full border-2 border-[#A6472B] text-[#A6472B] dark:text-[#E9E0CC] hover:bg-[#A6472B]/10 font-bold text-xs sm:text-sm transition-all"
              >
                <UserIcon className="w-4 h-4" />
                <span>Create an Account</span>
              </Link>
            </div>
          </div>
        )}

        {/* =========================================================================
            2. DEDICATED CREATE ACCOUNT VIEW (/signup)
           ========================================================================= */}
        {mode === 'signup' && (
          <div>
            {/* Bespoke Google Fast Sign-Up */}
            <button
              type="button"
              onClick={handleGoogleButtonClick}
              disabled={loading}
              className="w-full py-3 px-4 rounded-full border border-[#ECD5A5] dark:border-[#3D3D30] bg-[#FFF9EC] hover:bg-[#F9EAC7] dark:bg-[#2F2F26] dark:hover:bg-[#3D3D30] text-[#2A2A22] dark:text-white font-bold text-xs sm:text-sm shadow-warm-sm hover:shadow-warm-md transition-all flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-50"
            >
              <GoogleIcon />
              <span>Sign up with Google</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-5">
              <div className="border-t border-[#ECD5A5] dark:border-[#3D3D30] w-full"></div>
              <span className="bg-[#FFF9EC] dark:bg-[#23231C] px-3 text-[11px] font-bold text-[#5A5748] dark:text-[#C4BFB2] uppercase tracking-wider">
                or 
              </span>
              <div className="border-t border-[#ECD5A5] dark:border-[#3D3D30] w-full"></div>
            </div>

            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#5A5748] dark:text-[#DDD8CB] mb-1.5">Full Name</label>
                <div className="relative flex items-center">
                  <UserIcon className="w-4 h-4 text-[#5A5748] dark:text-[#C4BFB2] absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    className="w-full h-11 pl-10 pr-4 rounded-2xl border border-[#ECD5A5] dark:border-[#3D3D30] bg-[#FFF9EC] dark:bg-[#2F2F26] text-[#2A2A22] dark:text-white placeholder:text-[#5A5748]/70 dark:placeholder:text-[#C4BFB2]/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#A6472B] focus:ring-2 focus:ring-[#A6472B]/20 transition-all"
                    value={signupData.name}
                    onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                    placeholder="Enter your name"
                  />
                </div>
                {errors.name && <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5A5748] dark:text-[#DDD8CB] mb-1.5">Phone Number</label>
                <div className="flex items-center rounded-2xl border border-[#ECD5A5] dark:border-[#3D3D30] bg-[#FFF9EC] dark:bg-[#2F2F26] overflow-hidden focus-within:border-[#A6472B] focus-within:ring-2 focus-within:ring-[#A6472B]/20 transition-all">
                  <span className="px-3.5 py-3 bg-[#F9EAC7] dark:bg-[#23231C] text-[#2A2A22] dark:text-white text-xs font-bold border-r border-[#ECD5A5] dark:border-[#3D3D30]">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    className="w-full px-3.5 py-3 bg-transparent text-[#2A2A22] dark:text-white placeholder:text-[#5A5748]/70 dark:placeholder:text-[#C4BFB2]/70 text-sm font-semibold focus:outline-none"
                    placeholder="10-digit mobile"
                    value={signupData.phone}
                    maxLength={10}
                    onChange={(e) => setSignupData({ ...signupData, phone: e.target.value.replace(/\D/g, '') })}
                  />
                </div>
                {errors.phone && <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5A5748] dark:text-[#DDD8CB] mb-1.5">Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-[#5A5748] dark:text-[#C4BFB2] absolute left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    className="w-full h-11 pl-10 pr-4 rounded-2xl border border-[#ECD5A5] dark:border-[#3D3D30] bg-[#FFF9EC] dark:bg-[#2F2F26] text-[#2A2A22] dark:text-white placeholder:text-[#5A5748]/70 dark:placeholder:text-[#C4BFB2]/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#A6472B] focus:ring-2 focus:ring-[#A6472B]/20 transition-all"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    placeholder="yourname@gmail.com"
                  />
                </div>
                {errors.email && <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5A5748] dark:text-[#DDD8CB] mb-1.5">Create Password</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-[#5A5748] dark:text-[#C4BFB2] absolute left-3.5 pointer-events-none" />
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    className="w-full h-11 pl-10 pr-11 rounded-2xl border border-[#ECD5A5] dark:border-[#3D3D30] bg-[#FFF9EC] dark:bg-[#2F2F26] text-[#2A2A22] dark:text-white placeholder:text-[#5A5748]/70 dark:placeholder:text-[#C4BFB2]/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#A6472B] focus:ring-2 focus:ring-[#A6472B]/20 transition-all"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3.5 text-[#5A5748] hover:text-[#2A2A22] dark:text-[#C4BFB2] dark:hover:text-white transition-colors"
                    title={showSignupPassword ? 'Hide password' : 'Show password'}
                    aria-label="Toggle password visibility"
                  >
                    {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full bg-[#A6472B] hover:bg-[#7E351F] text-white font-bold text-sm shadow-glow-terracotta transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Creating Account...' : 'Sign Up & Continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-8 pt-5 border-t border-[#ECD5A5] dark:border-[#3D3D30] text-center">
              <p className="text-xs text-[#5A5748] dark:text-[#DDD8CB] mb-2">Already have an account?</p>
              <Link
                to={`/login${searchParamStr}`}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#A6472B] dark:text-[#E9E0CC] hover:underline transition-colors"
              >
                <span>Sign In Here</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* =========================================================================
            3. FORGOT PASSWORD VIEW (3-STEP DEDICATED SCREENS)
           ========================================================================= */}
        {mode === 'forgot' && (
          forgotStep === 'enter_email' ? (
            /* STEP 1: Enter Email */
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#6B5B52] dark:text-[#D6C7BD] mb-1.5">Registered Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-[#6B5B52] dark:text-[#C5B4A8] absolute left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    className="w-full h-11 pl-10 pr-4 rounded-2xl border border-[#ECD5A5] dark:border-[#4A3B32] bg-[#FFF9EC] dark:bg-[#362E2A] text-[#231F20] dark:text-white placeholder:text-[#8F7E75] dark:placeholder:text-[#8F7E75] text-xs sm:text-sm font-medium focus:outline-none focus:border-[#9F7A60] focus:ring-2 focus:ring-[#9F7A60]/20 transition-all"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Enter your registered email"
                  />
                </div>
                {errors.forgotEmail && <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.forgotEmail}</p>}
              </div>

              <button
                type="submit"
                disabled={loading || !forgotEmail}
                className="w-full py-3.5 rounded-full bg-[#9F7A60] hover:bg-[#87644C] text-white font-bold text-sm shadow-glow-terracotta transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Sending code...' : 'Send Verification Code'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#6B5B52] dark:text-[#C5B4A8] hover:text-[#231F20] dark:hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </form>
          ) : forgotStep === 'enter_otp' ? (
            /* STEP 2: Dedicated OTP Verification Screen */
            <form onSubmit={handleVerifyResetOtp} className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#6B5B52] dark:text-[#D6C7BD] mb-1">
                <span>Sent to <strong className="text-[#231F20] dark:text-white">{forgotEmail}</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setForgotStep('enter_email');
                    setForgotOtp('');
                  }}
                  className="text-[#9F7A60] font-bold hover:underline"
                >
                  Change
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B5B52] dark:text-[#D6C7BD] mb-1.5">Verification Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full px-4 py-3 rounded-2xl border border-[#ECD5A5] dark:border-[#4A3B32] bg-[#FFF9EC] dark:bg-[#362E2A] text-[#231F20] dark:text-white text-center tracking-[8px] font-extrabold text-xl focus:outline-none focus:border-[#9F7A60] focus:ring-2 focus:ring-[#9F7A60]/20 transition-all"
                  placeholder="••••••"
                  value={forgotOtp}
                  maxLength={6}
                  onChange={(e) => {
                    setForgotOtp(e.target.value.replace(/\D/g, ''));
                    if (errors.forgotOtp) setErrors({});
                  }}
                />
                {errors.forgotOtp && <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.forgotOtp}</p>}
              </div>

              <div className="flex items-center justify-between px-1 text-xs">
                <span className="text-[#6B5B52] dark:text-[#D6C7BD]">Didn't receive email code?</span>
                <button
                  type="button"
                  disabled={forgotCountdown > 0 || loading}
                  onClick={handleForgotPasswordSubmit}
                  className="font-bold text-[#9F7A60] dark:text-[#E8D8CD] hover:underline disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {forgotCountdown > 0 ? `Resend in ${forgotCountdown}s` : 'Resend Code'}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || forgotOtp.length !== 6}
                className="w-full py-3.5 rounded-full bg-[#9F7A60] hover:bg-[#87644C] text-white font-bold text-sm shadow-glow-terracotta transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                <span>{loading ? 'Verifying...' : 'Verify Code & Proceed'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#6B5B52] dark:text-[#C5B4A8] hover:text-[#231F20] dark:hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </form>
          ) : (
            /* STEP 3: Dedicated Create New Password Screen */
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span>Code verified for <strong className="text-emerald-900 dark:text-emerald-100">{forgotEmail}</strong></span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B5B52] dark:text-[#D6C7BD] mb-1.5">New Password</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-[#6B5B52] dark:text-[#C5B4A8] absolute left-3.5 pointer-events-none" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="new_password_field"
                    autoComplete="new-password"
                    className="w-full h-11 pl-10 pr-10 rounded-2xl border border-[#ECD5A5] dark:border-[#4A3B32] bg-[#FFF9EC] dark:bg-[#362E2A] text-[#231F20] dark:text-white placeholder:text-[#8F7E75] dark:placeholder:text-[#8F7E75] text-xs sm:text-sm font-medium focus:outline-none focus:border-[#9F7A60] focus:ring-2 focus:ring-[#9F7A60]/20 transition-all"
                    value={forgotNewPassword}
                    onChange={(e) => {
                      setForgotNewPassword(e.target.value);
                      if (errors.forgotNewPassword) setErrors({});
                    }}
                    placeholder="Enter at least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 text-[#6B5B52] dark:text-[#C5B4A8] hover:text-[#231F20] dark:hover:text-white focus:outline-none"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.forgotNewPassword && <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.forgotNewPassword}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B5B52] dark:text-[#D6C7BD] mb-1.5">Confirm New Password</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-[#6B5B52] dark:text-[#C5B4A8] absolute left-3.5 pointer-events-none" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="confirm_password_field"
                    autoComplete="new-password"
                    className="w-full h-11 pl-10 pr-4 rounded-2xl border border-[#ECD5A5] dark:border-[#4A3B32] bg-[#FFF9EC] dark:bg-[#362E2A] text-[#231F20] dark:text-white placeholder:text-[#8F7E75] dark:placeholder:text-[#8F7E75] text-xs sm:text-sm font-medium focus:outline-none focus:border-[#9F7A60] focus:ring-2 focus:ring-[#9F7A60]/20 transition-all"
                    value={forgotConfirmPassword}
                    onChange={(e) => {
                      setForgotConfirmPassword(e.target.value);
                      if (errors.forgotConfirmPassword) setErrors({});
                    }}
                    placeholder="Re-enter your new password"
                  />
                </div>
                {errors.forgotConfirmPassword && <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.forgotConfirmPassword}</p>}
              </div>

              <button
                type="submit"
                disabled={loading || forgotNewPassword.length < 6}
                className="w-full py-3.5 rounded-full bg-[#231F20] dark:bg-[#9F7A60] hover:bg-[#362E2A] dark:hover:bg-[#87644C] text-white font-bold text-sm shadow-warm-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                <span>{loading ? 'Saving New Password...' : 'Save Password & Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#6B5B52] dark:text-[#C5B4A8] hover:text-[#231F20] dark:hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </form>
          )
        )}
        </>
        )}

      </div>
    </div>
  );
};

export default Auth;
