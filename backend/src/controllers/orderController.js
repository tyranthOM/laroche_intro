const mongoose = require('mongoose');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Counter = require('../models/Counter');
const { getStoreStatusHelper } = require('./kitchenController');

// Helper to atomically acquire the next daily sequential order number (resets to #1 each day at 00:00 IST)
const getNextOrderNumber = async () => {
  // Format current date in IST (Asia/Kolkata) as YYYY-MM-DD
  const todayKey = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const counterKey = `order_token_${todayKey}`;

  const updated = await Counter.findByIdAndUpdate(
    counterKey,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return updated.seq;
};

// @route GET /api/orders/store-status
// Public — check if cafe is currently accepting orders or paused
const getPublicStoreStatus = async (req, res, next) => {
  try {
    const status = await getStoreStatusHelper();
    res.status(200).json(status);
  } catch (error) {
    next(error);
  }
};

// @route POST /api/orders
// Student-only — place a new order with server-verified pricing (blocks price tampering)
const placeOrder = async (req, res, next) => {
  try {
    // Check if kitchen has paused new orders due to rush/overcrowding
    const storeStatus = await getStoreStatusHelper();
    if (storeStatus.paused) {
      return res.status(403).json({
        message: storeStatus.reason || 'The kitchen is currently overloaded and pausing new orders. Please try again shortly.',
        storePaused: true,
        resumeAt: storeStatus.resumeAt,
      });
    }

    const { items } = req.body;


    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    // Extract base item IDs and any attached addon IDs from database
    const baseItemIds = items.map((i) => i.menuItem || i._id).filter((id) => mongoose.Types.ObjectId.isValid(id));
    const addonItemIds = items
      .flatMap((i) => (Array.isArray(i.addons) ? i.addons.map((a) => a._id || a.menuItem) : []))
      .filter((id) => mongoose.Types.ObjectId.isValid(id));

    const allDbIds = Array.from(new Set([...baseItemIds, ...addonItemIds]));

    const dbMenuItems = await MenuItem.find({ _id: { $in: allDbIds } }).lean();
    const dbItemMap = new Map(dbMenuItems.map((item) => [item._id.toString(), item]));

    const verifiedItems = [];

    for (const item of items) {
      const itemId = (item.menuItem || item._id)?.toString();
      const dbItem = dbItemMap.get(itemId);

      if (!dbItem) {
        return res.status(400).json({ message: `Item not found or no longer available` });
      }

      if (dbItem.isAvailable === false) {
        return res.status(400).json({ message: `"${dbItem.name}" is currently sold out / unavailable` });
      }

      const quantity = parseInt(item.quantity, 10);
      if (isNaN(quantity) || quantity < 1 || quantity > 50) {
        return res.status(400).json({ message: `Invalid quantity for "${dbItem.name}"` });
      }

      // Determine server-verified price (including variants if applicable)
      let verifiedBasePrice = Number(dbItem.price) || 0;
      if (Array.isArray(dbItem.variants) && dbItem.variants.length > 0) {
        const matchingVariant = dbItem.variants.find(
          (v) => (item.name && item.name.includes(v.label)) || (item.variant && item.variant === v.label) || v.price === item.price
        );
        if (matchingVariant && typeof matchingVariant.price === 'number') {
          verifiedBasePrice = matchingVariant.price;
        }
      }

      // Verify and calculate attached add-ons server-side
      const verifiedAddons = [];
      let addonsTotal = 0;
      if (Array.isArray(item.addons) && item.addons.length > 0) {
        for (const addon of item.addons) {
          const addonId = (addon._id || addon.menuItem)?.toString();
          const addonDbItem = addonId ? dbItemMap.get(addonId) : null;

          if (addonDbItem && addonDbItem.isAvailable !== false) {
            const addonPrice = Number(addonDbItem.price) || 0;
            verifiedAddons.push({
              _id: addonDbItem._id,
              name: addonDbItem.name,
              price: addonPrice,
            });
            addonsTotal += addonPrice;
          } else if (addon.name && typeof addon.price === 'number' && addon.price >= 0) {
            verifiedAddons.push({
              name: String(addon.name).slice(0, 50),
              price: Number(addon.price),
            });
            addonsTotal += Number(addon.price);
          }
        }
      }

      const unitPrice = verifiedBasePrice + addonsTotal;

      verifiedItems.push({
        menuItem: dbItem._id,
        name: dbItem.name,
        price: unitPrice,
        quantity,
        addons: verifiedAddons,
      });
    }

    const totalAmount = verifiedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Calculate sequential order number atomically (prevents duplicate tokens during rush spikes)
    const orderNumber = await getNextOrderNumber();

    const newOrder = await Order.create({
      orderNumber,
      student: req.user.id,
      items: verifiedItems,
      totalAmount,
      status: 'placed',
    });

    res.status(201).json(newOrder);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/orders/my
// Student-only — get logged-in student's order history
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ student: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/orders/:id
// Student or kitchen/admin — get single order with strict IDOR verification
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid order ID format' });
    }

    const order = await Order.findById(id).populate('student', 'name email phone');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // IDOR Protection: Students can ONLY view their own orders; staff/kitchen can view any
    const orderStudentId = order.student?._id ? order.student._id.toString() : (order.student ? order.student.toString() : null);
    const isStaff = ['kitchen', 'cms', 'admin'].includes(req.user.role);

    if (!isStaff && orderStudentId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You do not have permission to view this order' });
    }

    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

module.exports = { placeOrder, getMyOrders, getOrderById, getPublicStoreStatus };
