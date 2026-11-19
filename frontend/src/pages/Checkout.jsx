import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { placeOrder, getStoreStatus } from '../services/orderService';
import { login as loginService } from '../services/authService';
import {
  createRazorpayOrder,
  verifyPayment,
  loadRazorpayScript,
} from '../services/paymentService';
import './Checkout.css';

const Checkout = () => {
  const { cartItems, totalAmount, clearCart } = useCart();
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState('idle'); // idle | placing | processing | success | failed
  const [errorMsg, setErrorMsg] = useState('');
  const [storeStatus, setStoreStatus] = useState({ paused: false, reason: '', resumeAt: null });
  const [agreedPrivacy, setAgreedPrivacy] = useState(() => {
    return localStorage.getItem('laroche_privacy_agreed') === 'true';
  });

  useEffect(() => {
    getStoreStatus()
      .then((data) => {
        if (data) setStoreStatus(data);
      })
      .catch(() => {});
  }, []);


  const handlePayment = async () => {
    let currentUser = user;

    // Require student authentication before checkout
    if (!currentUser || !localStorage.getItem('token')) {
      navigate('/login?redirect=/checkout');
      return;
    }

    if (!agreedPrivacy) {
      setErrorMsg('Please accept the Terms & Privacy Policy to proceed.');
      return;
    }

    if (storeStatus.paused) {
      setErrorMsg(storeStatus.reason || 'Kitchen has temporarily paused new orders. Please wait a few moments.');
      return;
    }

    setStatus('placing');
    setErrorMsg('');


    try {
      // Step 1: create the order in our DB (status: 'placed')
      const order = await placeOrder(cartItems);

      // Step 2: load Razorpay's checkout script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setErrorMsg('Could not load payment gateway. Check your connection.');
        setStatus('failed');
        return;
      }

      // Step 3: create a Razorpay order tied to our order
      const razorpayData = await createRazorpayOrder(order._id);

      // Method 2 (Domain Whitelist Bypass): If Razorpay Hosted Payment Page (rzp.io) is available,
      // redirect directly. This completely prevents "website does not match registered website" blocks!
      if (razorpayData?.paymentLinkUrl) {
        clearCart();
        try {
          localStorage.setItem('laroche_active_order_id', order._id);
          localStorage.setItem('laroche_active_order_num', order.orderNumber || '');
        } catch (e) {}

        window.location.href = razorpayData.paymentLinkUrl;
        return;
      }

      setStatus('processing');

      // Step 4: open Razorpay checkout popup
      const options = {
        key: razorpayData.keyId,
        amount: razorpayData.amount,
        currency: razorpayData.currency,
        name: 'La Roche Cafe',
        description: 'Order Payment',
        order_id: razorpayData.razorpayOrderId,
        prefill: {
          name: currentUser?.name || 'Student',
          email: currentUser?.email || 'student@larochecafe.in',
          contact: currentUser?.phone || '9876500000',
        },
        theme: {
          color: '#E85D04',
        },
        handler: async (response) => {
          // Step 5: verify payment on our backend
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: order._id,
            });

            clearCart();
            setStatus('success');

            try {
              localStorage.setItem('laroche_active_order_id', order._id);
              localStorage.setItem('laroche_active_order_num', order.orderNumber || '');
            } catch (e) {}

            setTimeout(() => {
              navigate(`/orders/${order._id}`);
            }, 1200);
          } catch (err) {
            setErrorMsg('Payment verification failed. Contact support if amount was deducted.');
            setStatus('failed');
          }
        },
        modal: {
          ondismiss: () => {
            setStatus('idle');
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (err) {
      console.error('Checkout payment error:', err);
      const isTokenIssue =
        err.response?.status === 401 ||
        err.response?.data?.message?.toLowerCase().includes('token');

      if (isTokenIssue) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setErrorMsg('Your login session has expired. Please log in again to complete your payment.');
      } else {
        setErrorMsg(err.response?.data?.message || 'Something went wrong. Please try again.');
      }
      setStatus('failed');
    }
  };

  if (cartItems.length === 0 && status === 'idle') {
    return (
      <div className="checkout-empty">
        <p>Your cart is empty.</p>
        <button onClick={() => navigate('/menu')}>Browse Menu</button>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>

      <div className="bill-summary">
        {cartItems.map((item) => (
          <div className="bill-row" key={`${item.menuItem}-${item.name}`}>
            <span>{item.name} x {item.quantity}</span>
            <span>₹{item.price * item.quantity}</span>
          </div>
        ))}
        <div className="bill-row bill-total">
          <span>Total</span>
          <span>₹{totalAmount}</span>
        </div>
      </div>

      {storeStatus.paused && (
        <div className="p-3 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 text-xs font-medium">
          ⚠️ <strong>Kitchen Rush:</strong> {storeStatus.reason || 'New orders are paused temporarily. Please try again shortly.'}
        </div>
      )}

      {errorMsg && (
        <div className="checkout-error p-3.5 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-center flex flex-col items-center gap-2">
          <p className="text-xs sm:text-sm font-semibold">{errorMsg}</p>
          {errorMsg.includes('session') && (
            <button
              type="button"
              onClick={() => navigate('/login?redirect=/checkout')}
              className="mt-1 px-5 py-2 rounded-full bg-[#A6472B] hover:bg-[#7E351F] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              Log In &amp; Continue Order
            </button>
          )}
        </div>
      )}

      {/* 1-Time Terms & Privacy Consent */}
      <label className="flex items-start gap-2.5 my-4 cursor-pointer select-none text-left bg-stone-50 dark:bg-[#2A221E] p-3 rounded-xl border border-stone-200 dark:border-[#3D312A]">
        <input
          type="checkbox"
          checked={agreedPrivacy}
          onChange={(e) => {
            setAgreedPrivacy(e.target.checked);
            if (e.target.checked) {
              localStorage.setItem('laroche_privacy_agreed', 'true');
            } else {
              localStorage.removeItem('laroche_privacy_agreed');
            }
          }}
          className="mt-0.5 rounded accent-[#A6472B] w-4 h-4 cursor-pointer"
        />
        <span className="text-xs text-stone-600 dark:text-stone-300 leading-snug">
          I agree to the{' '}
          <a href="/terms-and-conditions" target="_blank" rel="noreferrer" className="underline font-bold text-stone-900 dark:text-white">Terms</a>
          {' '}&{' '}
          <a href="/privacy-policy" target="_blank" rel="noreferrer" className="underline font-bold text-stone-900 dark:text-white">Privacy Policy</a>
        </span>
      </label>

      <button
        className="pay-btn"
        onClick={handlePayment}
        disabled={storeStatus.paused || !agreedPrivacy || status === 'placing' || status === 'processing' || status === 'success'}
      >
        {storeStatus.paused && 'Orders Temporarily Paused'}
        {!storeStatus.paused && !agreedPrivacy && 'Agree to Terms to Continue'}
        {!storeStatus.paused && agreedPrivacy && status === 'placing' && 'Placing order...'}
        {!storeStatus.paused && agreedPrivacy && status === 'processing' && 'Waiting for payment...'}
        {!storeStatus.paused && agreedPrivacy && status === 'success' && 'Payment successful ✓'}
        {!storeStatus.paused && agreedPrivacy && (status === 'idle' || status === 'failed') && `Pay ₹${totalAmount} via UPI / Cards`}
      </button>



      {status === 'success' && (
        <div className="payment-success-overlay">
          <div className="success-check">✓</div>
          <p>Payment Successful</p>
        </div>
      )}
    </div>
  );
};

export default Checkout;
