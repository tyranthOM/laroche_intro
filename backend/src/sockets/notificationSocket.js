const jwt = require('jsonwebtoken');

let io;

const getJwtSecret = () => {
  return process.env.JWT_SECRET || 'secret';
};

const initSocket = (server) => {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: '*', // allow frontend connections
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  // Security Middleware: Authenticate socket connection via JWT handshake
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, getJwtSecret());
        socket.user = decoded;
      } catch (err) {
        // Invalid or expired token — proceed as unauthenticated guest
        socket.user = null;
      }
    } else {
      socket.user = null;
    }
    next();
  });

  io.on('connection', (socket) => {
    // Kitchen staff only: strictly verify kitchen/cms/admin role before granting access to live orders
    socket.on('join_kitchen', () => {
      const allowedRoles = ['kitchen', 'cms', 'admin'];
      if (socket.user && allowedRoles.includes(socket.user.role)) {
        socket.join('kitchen');
      } else {
        console.warn(`[Socket Security] Unauthorized attempt to join kitchen room: socket ${socket.id}`);
      }
    });

    // Student room: only allow student to listen to their own personal room, or allow staff
    socket.on('join_student', (studentId) => {
      if (!socket.user) return;
      const currentUserId = (socket.user.id || socket.user._id)?.toString();
      const isStaff = ['kitchen', 'cms', 'admin'].includes(socket.user.role);

      if (currentUserId === studentId?.toString() || isStaff) {
        socket.join(`student:${studentId}`);
      } else {
        console.warn(`[Socket Security] Blocked student room join attempt: user ${currentUserId} tried to join ${studentId}`);
      }
    });

    // Specific order room: allow client tracking this order to receive live updates
    socket.on('join_order', (orderId) => {
      if (orderId) {
        socket.join(`order:${orderId.toString()}`);
      }
    });

    socket.on('disconnect', () => {
      // client disconnected
    });
  });

  return io;
};

// Called after successful payment / order placement
const notifyKitchenNewOrder = (order) => {
  if (io) {
    io.to('kitchen').emit('new_order', order);
    io.emit('order_status_updated', order);
  }
};

// Called when order status changes (preparing, ready, collected)
const notifyOrderStatusUpdated = (order) => {
  if (io) {
    const orderIdStr = (order._id || order.id)?.toString();
    const studentId = order.student?._id ? order.student._id.toString() : (order.student ? order.student.toString() : null);

    if (orderIdStr) {
      io.to(`order:${orderIdStr}`).emit('order_status_updated', order);
      if (order.status === 'ready') {
        io.to(`order:${orderIdStr}`).emit('order_ready', order);
      }
    }

    if (studentId) {
      io.to(`student:${studentId}`).emit('order_status_updated', order);
      if (order.status === 'ready') {
        io.to(`student:${studentId}`).emit('order_ready', order);
      }
    }

    io.to('kitchen').emit('order_status_updated', order);
    io.emit('order_status_updated', order);
  }
};

// Called when kitchen pauses/resumes order acceptance
const notifyStoreStatusChanged = (statusData) => {
  if (io) {
    io.emit('store_status_changed', statusData);
  }
};

// Backward-compatibility alias
const notifyStudentOrderReady = (studentId, order) => {
  notifyOrderStatusUpdated(order);
};

module.exports = { initSocket, notifyKitchenNewOrder, notifyOrderStatusUpdated, notifyStudentOrderReady, notifyStoreStatusChanged };
