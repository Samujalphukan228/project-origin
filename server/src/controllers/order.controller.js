import { orderModel } from "../models/orders.model.js";
import { tableSessionModel } from "../models/table.model.js";

// ✅ Customer places an order
export const placeOrder = async (req, res) => {
  try {
    const { sessionToken, items } = req.body;

    if (!sessionToken || !items?.length)
      return res.status(400).json({ success: false, message: "Missing session or items" });

    const session = await tableSessionModel.findOne({ sessionToken, isActive: true });
    if (!session)
      return res.status(400).json({ success: false, message: "Invalid or expired session" });

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = await orderModel.create({
      sessionToken,
      tableNumber: session.tableNumber,
      items,
      totalAmount,
      status: "pending",
    });

    // ✅ Emit to kitchen, waiter, admin + specific table
    const io = req.app.get("io");
    const payload = {
      orderId: order._id,
      _id: order._id,
      tableNumber: order.tableNumber,
      items: order.items,
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt,
      sessionToken: order.sessionToken,
    };

    if (io) {
      console.log(`📢 Broadcasting new order from table ${order.tableNumber}`);
      io.to("role:waiter").emit("newOrder", payload);
      io.to("role:kitchen").emit("newOrder", payload);
      io.to("role:admin").emit("newOrder", payload);
      io.to(`table:${order.tableNumber}`).emit("newOrder", payload);
    }

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    console.error("❌ placeOrder error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get orders by table (for waiters/customers)
export const getOrdersByTable = async (req, res) => {
  try {
    const { tableNumber } = req.params;
    const orders = await orderModel.find({ tableNumber }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("❌ getOrdersByTable error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update order status (kitchen/admin)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "preparing", "served"].includes(status))
      return res.status(400).json({ success: false, message: "Invalid status value" });

    const order = await orderModel.findById(id);
    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

    const oldStatus = order.status;
    order.status = status;
    await order.save();

    // ✅ Emit live status change to all relevant parties
    const io = req.app.get("io");
    const payload = {
      _id: order._id,
      orderId: order._id,
      tableNumber: order.tableNumber,
      status: order.status,
      oldStatus,
      items: order.items,
      totalAmount: order.totalAmount,
      sessionToken: order.sessionToken,
      createdAt: order.createdAt,
      updatedAt: new Date(),
    };

    if (io) {
      console.log(`📢 Order ${order._id} status: ${oldStatus} → ${status}`);
      io.to("role:waiter").emit("orderStatusUpdated", payload);
      io.to("role:kitchen").emit("orderStatusUpdated", payload);
      io.to("role:admin").emit("orderStatusUpdated", payload);
      io.to(`table:${order.tableNumber}`).emit("orderStatusUpdated", payload);
    }

    return res.status(200).json({
      success: true,
      message: `Order marked as '${status}'`,
      order,
    });
  } catch (error) {
    console.error("❌ updateOrderStatus error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get all orders (for kitchen dashboard)
export const getAllOrders = async (req, res) => {
  try {
    const orders = await orderModel
      .find()
      .sort({ createdAt: -1 })
      .lean();

    const formattedOrders = orders.map(order => ({
      _id: order._id,
      tableNumber: order.tableNumber,
      sessionToken: order.sessionToken,
      status: order.status,
      totalAmount: order.totalAmount,
      items: order.items || [],
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      orders: formattedOrders,
    });
  } catch (error) {
    console.error('❌ getAllOrders error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message,
    });
  }
};

// ✅ Cancel order (NEW - with socket notification)
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await orderModel.findById(id);
    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

    // Only allow canceling pending orders
    if (order.status !== "pending") {
      return res.status(400).json({ 
        success: false, 
        message: "Only pending orders can be cancelled" 
      });
    }

    await orderModel.findByIdAndDelete(id);

    // ✅ Notify all parties about cancellation
    const io = req.app.get("io");
    const payload = {
      orderId: order._id,
      _id: order._id,
      tableNumber: order.tableNumber,
      status: "cancelled",
      items: order.items,
      totalAmount: order.totalAmount,
    };

    if (io) {
      console.log(`📢 Order ${order._id} cancelled from table ${order.tableNumber}`);
      io.to("role:waiter").emit("orderCancelled", payload);
      io.to("role:kitchen").emit("orderCancelled", payload);
      io.to("role:admin").emit("orderCancelled", payload);
      io.to(`table:${order.tableNumber}`).emit("orderCancelled", payload);
    }

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    console.error("❌ cancelOrder error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get active orders count (NEW - for dashboard stats)
export const getActiveOrdersCount = async (req, res) => {
  try {
    const counts = await orderModel.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      pending: 0,
      preparing: 0,
      served: 0,
      total: 0
    };

    counts.forEach(item => {
      stats[item._id] = item.count;
      stats.total += item.count;
    });

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('❌ getActiveOrdersCount error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};