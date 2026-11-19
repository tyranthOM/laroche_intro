const crypto = require('crypto');
const mongoose = require('mongoose');
const razorpayInstance = require('../config/razorpay');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const { notifyKitchenNewOrder } = require('../sockets/notificationSocket');

// @route POST /api/payment/create-order
// Student-only — creates a Razorpay order and hosted payment link for an existing (unpaid) order
const createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Valid order ID is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // IDOR Protection: verify student ownership
    if (order.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You cannot initiate payment for this order' });
    }

    if (order.status !== 'placed') {
      return res.status(400).json({ message: 'Order is not eligible for payment (already paid or cancelled)' });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ message: 'Payment gateway configuration error' });
    }

    // 1. Razorpay standard order creation (amount in paise)
    const razorpayOrder = await razorpayInstance.orders.create({
      amount: Math.round(order.totalAmount * 100),
      currency: 'INR',
      receipt: `receipt_${order._id}`,
    });

    // 2. Razorpay Hosted Payment Link creation (bypasses domain mismatch completely on rzp.io)
    let paymentLinkUrl = null;
    let paymentLinkId = null;

    try {
      if (razorpayInstance && razorpayInstance.paymentLink && typeof razorpayInstance.paymentLink.create === 'function') {
        const cleanPhone = req.user?.phone ? String(req.user.phone).replace(/\D/g, '').slice(-10) : '';
        const orderShortNum = order.orderNumber || order._id.toString().slice(-6);

        const paymentLink = await razorpayInstance.paymentLink.create({
          amount: Math.round(order.totalAmount * 100),
          currency: 'INR',
          accept_partial: false,
          reference_id: order._id.toString(),
          description: `La Roche Cafe - Order #${orderShortNum}`,
          customer: {
            name: req.user?.name || 'Student',
            email: req.user?.email || 'student@larochecafe.in',
            contact: cleanPhone && cleanPhone.length === 10 ? cleanPhone : '9876543210',
          },
          notify: {
            sms: false,
            email: false,
          },
          reminder_enable: false,
          notes: {
            orderId: order._id.toString(),
            orderNumber: String(orderShortNum),
          },
          callback_url: `https://larochecafe.in/orders/${order._id}?payment_link=true`,
          callback_method: 'get',
        });

        if (paymentLink && paymentLink.short_url) {
          paymentLinkUrl = paymentLink.short_url;
          paymentLinkId = paymentLink.id;
        }
      }
    } catch (linkErr) {
      console.warn('Hosted Payment Link notice (falling back to standard checkout):', linkErr.message);
    }

    const payment = await Payment.create({
      order: order._id,
      razorpayOrderId: razorpayOrder.id,
      paymentLinkId,
      paymentLinkUrl,
      amount: order.totalAmount,
      status: 'created',
    });

    order.paymentId = payment._id;
    await order.save();

    res.status(200).json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      paymentLinkUrl, // When present, frontend redirects to rzp.io to bypass domain block!
      paymentLinkId,
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/payment/verify
// Student-only — verifies Razorpay signature cryptographically and marks order paid
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({ message: 'All payment verification parameters are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID format' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // IDOR Protection: student must own the order
    if (order.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: Payment record mismatch' });
    }

    // Find the corresponding payment record
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment || payment.order.toString() !== orderId) {
      return res.status(400).json({ message: 'Payment record does not match the specified order' });
    }

    if (payment.status === 'paid') {
      return res.status(200).json({ message: 'Order is already marked as paid', order });
    }

    // Cryptographic signature verification with timingSafeEqual to prevent timing attacks
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({ message: 'Server payment configuration missing' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const signatureBuffer = Buffer.from(razorpay_signature, 'utf8');

    const isMatch =
      expectedBuffer.length === signatureBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, signatureBuffer);

    if (!isMatch) {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { status: 'failed' }
      );
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: 'paid',
      }
    );

    order.status = 'paid';
    await order.save();

    const populatedOrder = await Order.findById(orderId).populate('student', 'name email phone');

    // Push new order to kitchen dashboard in real-time
    notifyKitchenNewOrder(populatedOrder);

    res.status(200).json({ message: 'Payment verified successfully', order: populatedOrder });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/payment/verify-link
// Student-only — verifies a Razorpay hosted payment link callback upon return to /orders/:id
const verifyPaymentLink = async (req, res, next) => {
  try {
    const { orderId, paymentLinkId, paymentId } = req.body;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Valid order ID is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // IDOR Protection: student must own the order
    if (order.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: Payment record mismatch' });
    }

    // If order is already paid, return immediately
    if (order.status !== 'placed') {
      const populated = await Order.findById(orderId).populate('student', 'name email phone');
      return res.status(200).json({ message: 'Order is already marked as paid', order: populated });
    }

    const payment = await Payment.findOne({ order: order._id });

    // Verify status with Razorpay API directly (server-to-server)
    const targetLinkId = paymentLinkId || payment?.paymentLinkId;
    let isPaidConfirmed = false;
    let confirmedPaymentId = paymentId || payment?.razorpayPaymentId;

    if (targetLinkId && razorpayInstance?.paymentLink?.fetch) {
      try {
        const linkData = await razorpayInstance.paymentLink.fetch(targetLinkId);
        if (
          linkData &&
          (linkData.status === 'paid' ||
            (linkData.amount_paid && linkData.amount_paid >= Math.round(order.totalAmount * 100)))
        ) {
          isPaidConfirmed = true;
          if (linkData.payments && linkData.payments.length > 0) {
            confirmedPaymentId = linkData.payments[0].payment_id;
          }
        }
      } catch (fetchErr) {
        console.warn('Error fetching payment link status from Razorpay:', fetchErr.message);
      }
    }

    // If paymentId is present, check payment details via Razorpay API
    if (!isPaidConfirmed && confirmedPaymentId && razorpayInstance?.payments?.fetch) {
      try {
        const payData = await razorpayInstance.payments.fetch(confirmedPaymentId);
        if (payData && (payData.status === 'captured' || payData.status === 'authorized')) {
          isPaidConfirmed = true;
        }
      } catch (payErr) {
        console.warn('Error fetching payment details from Razorpay:', payErr.message);
      }
    }

    if (isPaidConfirmed) {
      if (payment) {
        payment.status = 'paid';
        if (confirmedPaymentId) payment.razorpayPaymentId = confirmedPaymentId;
        await payment.save();
      }

      order.status = 'paid';
      await order.save();

      const populatedOrder = await Order.findById(orderId).populate('student', 'name email phone');
      notifyKitchenNewOrder(populatedOrder);

      return res.status(200).json({ message: 'Payment verified successfully via hosted link', order: populatedOrder });
    }

    // Still processing
    return res.status(200).json({ message: 'Payment processing', order });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/payment/webhook
// Razorpay Server-to-Server Webhook backup: catches payments if student browser closes or network drops
const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers['x-razorpay-signature'];
      const shasum = crypto.createHmac('sha256', webhookSecret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest('hex');

      if (signature !== digest) {
        return res.status(400).json({ status: 'invalid_signature' });
      }
    }

    const event = req.body.event;
    if (
      event === 'order.paid' ||
      event === 'payment.captured' ||
      event === 'payment_link.paid'
    ) {
      const razorpayOrderId =
        req.body?.payload?.order?.entity?.id || req.body?.payload?.payment?.entity?.order_id;
      const razorpayPaymentId = req.body?.payload?.payment?.entity?.id;
      const paymentLinkId = req.body?.payload?.payment_link?.entity?.id;
      const referenceId =
        req.body?.payload?.payment_link?.entity?.reference_id ||
        req.body?.payload?.payment_link?.entity?.notes?.orderId ||
        req.body?.payload?.order?.entity?.notes?.orderId;

      let payment = null;
      if (razorpayOrderId) {
        payment = await Payment.findOne({ razorpayOrderId });
      }
      if (!payment && paymentLinkId) {
        payment = await Payment.findOne({ paymentLinkId });
      }
      if (!payment && referenceId && mongoose.Types.ObjectId.isValid(referenceId)) {
        payment = await Payment.findOne({ order: referenceId });
      }

      if (payment) {
        if (payment.status !== 'paid') {
          payment.status = 'paid';
          if (razorpayPaymentId) payment.razorpayPaymentId = razorpayPaymentId;
          await payment.save();
        }

        const order = await Order.findById(payment.order);
        if (order && order.status !== 'paid') {
          order.status = 'paid';
          await order.save();

          const populatedOrder = await Order.findById(order._id).populate('student', 'name email phone');
          notifyKitchenNewOrder(populatedOrder);
        }
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook processing error:', error.message);
    return res.status(200).json({ status: 'error_logged' });
  }
};

module.exports = { createRazorpayOrder, verifyPayment, verifyPaymentLink, handleRazorpayWebhook };
