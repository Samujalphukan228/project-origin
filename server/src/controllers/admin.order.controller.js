import { orderModel, topSellingItemModel, salesAnalyticsModel } from "../models/orders.model.js";

/* ================== GET ALL ORDERS (ADMIN) - NEW ================== */
export const getAllOrdersAdmin = async (req, res) => {
  try {
    const { limit = 100, status, tableNumber, startDate, endDate } = req.query;

    let query = {};
    
    if (status) query.status = status;
    if (tableNumber) query.tableNumber = parseInt(tableNumber);
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const orders = await orderModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    return res.status(200).json({
      success: true,
      orders,
      count: orders.length,
    });
  } catch (error) {
    console.error("❌ Admin get all orders error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================== GET ORDER BY ID (ADMIN) - NEW ================== */
export const getOrderByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await orderModel.findById(id).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("❌ Get order by ID error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================== GET TOP SELLING ITEMS ================== */
export const getTopSellingItems = async (req, res) => {
  try {
    const { limit = 10, sortBy = "quantity" } = req.query;

    const sortField = sortBy === "revenue" ? "totalRevenue" : "totalQuantitySold";

    let topItems = await topSellingItemModel
      .find()
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit))
      .lean();

    // ✅ Fallback: Calculate from orders if topSellingItemModel is empty
    if (topItems.length === 0) {
      console.log("📊 Top selling items model is empty, calculating from orders...");
      topItems = await orderModel.aggregate([
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.name",
            name: { $first: "$items.name" },
            totalQuantitySold: { $sum: "$items.quantity" },
            totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
            price: { $first: "$items.price" },
            timesOrdered: { $sum: 1 }
          }
        },
        {
          $sort: sortBy === 'revenue' ? { totalRevenue: -1 } : { totalQuantitySold: -1 }
        },
        { $limit: parseInt(limit) }
      ]);
    }

    res.status(200).json({
      success: true,
      count: topItems.length,
      topItems,
    });
  } catch (error) {
    console.error("Get top selling items error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================== GET SALES ANALYTICS ================== */
export const getSalesAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else {
      // Default: Last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.date = { $gte: thirtyDaysAgo };
    }

    let analytics = await salesAnalyticsModel.find(query).sort({ date: -1 }).lean();

    // ✅ Fallback: Calculate from orders if salesAnalyticsModel is empty
    if (analytics.length === 0) {
      console.log("📊 Sales analytics model is empty, calculating from orders...");
      
      const matchQuery = {};
      if (startDate || endDate) {
        matchQuery.createdAt = {};
        if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          matchQuery.createdAt.$lte = end;
        }
      } else {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        matchQuery.createdAt = { $gte: thirtyDaysAgo };
      }

      analytics = await orderModel.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" }
            },
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: "$totalAmount" },
            totalItemsSold: { $sum: { $size: "$items" } }
          }
        },
        {
          $project: {
            _id: 0,
            date: {
              $dateFromParts: {
                year: "$_id.year",
                month: "$_id.month",
                day: "$_id.day"
              }
            },
            totalOrders: 1,
            totalRevenue: 1,
            totalItemsSold: 1,
            averageOrderValue: {
              $cond: [
                { $eq: ["$totalOrders", 0] },
                0,
                { $divide: ["$totalRevenue", "$totalOrders"] }
              ]
            }
          }
        },
        { $sort: { date: -1 } }
      ]);
    }

    // Calculate totals
    const totals = analytics.reduce(
      (acc, day) => ({
        totalOrders: acc.totalOrders + (day.totalOrders || 0),
        totalRevenue: acc.totalRevenue + (day.totalRevenue || 0),
        totalItemsSold: acc.totalItemsSold + (day.totalItemsSold || 0),
      }),
      { totalOrders: 0, totalRevenue: 0, totalItemsSold: 0 }
    );

    totals.averageOrderValue =
      totals.totalOrders > 0 ? totals.totalRevenue / totals.totalOrders : 0;

    res.status(200).json({
      success: true,
      period: {
        startDate: startDate || "Last 30 days",
        endDate: endDate || "Today",
      },
      analytics,
      totals,
    });
  } catch (error) {
    console.error("Get sales analytics error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================== GET TODAY'S SALES ================== */
export const getTodaySales = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's orders
    const orders = await orderModel.find({
      createdAt: { $gte: today, $lt: tomorrow },
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = orders.length;
    const totalItems = orders.reduce(
      (sum, order) => sum + order.items.reduce((s, item) => s + item.quantity, 0),
      0
    );

    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const preparingOrders = orders.filter((o) => o.status === "preparing").length;
    const servedOrders = orders.filter((o) => o.status === "served").length;

    res.status(200).json({
      success: true,
      today: {
        date: today,
        totalOrders,
        totalRevenue,
        totalItems,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        ordersByStatus: {
          pending: pendingOrders,
          preparing: preparingOrders,
          served: servedOrders,
        },
      },
    });
  } catch (error) {
    console.error("Get today's sales error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================== GET DASHBOARD STATS ================== */
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's stats
    const todayOrders = await orderModel.find({
      createdAt: { $gte: today, $lt: tomorrow },
    });

    const todayRevenue = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const todayItems = todayOrders.reduce(
      (sum, order) => sum + order.items.reduce((s, item) => s + item.quantity, 0),
      0
    );

    // All-time stats
    const totalOrders = await orderModel.countDocuments();
    const allOrders = await orderModel.find();
    const totalRevenue = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalItems = allOrders.reduce(
      (sum, order) => sum + order.items.reduce((s, item) => s + item.quantity, 0),
      0
    );

    // ✅ Recent orders for display
    const recentOrders = await orderModel
      .find()
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Top selling items (with fallback)
    let topItems = await topSellingItemModel
      .find()
      .sort({ totalQuantitySold: -1 })
      .limit(5)
      .lean();

    // ✅ Fallback: Calculate from orders if topSellingItemModel is empty
    if (topItems.length === 0) {
      topItems = await orderModel.aggregate([
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.name",
            name: { $first: "$items.name" },
            totalQuantitySold: { $sum: "$items.quantity" },
            totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
            price: { $first: "$items.price" }
          }
        },
        { $sort: { totalQuantitySold: -1 } },
        { $limit: 5 }
      ]);
    }

    // Orders by status (today)
    const pendingOrders = todayOrders.filter((o) => o.status === "pending").length;
    const preparingOrders = todayOrders.filter((o) => o.status === "preparing").length;
    const servedOrders = todayOrders.filter((o) => o.status === "served").length;

    // Last 7 days revenue trend
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weekAnalytics = await salesAnalyticsModel
      .find({ date: { $gte: sevenDaysAgo } })
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      stats: {
        today: {
          orders: todayOrders.length,
          revenue: todayRevenue,
          items: todayItems,
          averageOrderValue:
            todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0,
          ordersByStatus: {
            pending: pendingOrders,
            preparing: preparingOrders,
            served: servedOrders,
          },
        },
        allTime: {
          totalOrders,
          totalRevenue,
          totalItems,
          averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        },
        topSellingItems: topItems,
        last7Days: weekAnalytics,
        recentOrders, // ✅ Recent orders array
        // ✅ Flattened stats for easier access
        todayOrders: todayOrders.length,
        pending: pendingOrders,
        preparing: preparingOrders,
        served: servedOrders,
        todayRevenue,
        revenueGrowth: "+0%",
        ordersGrowth: "+0%",
      },
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================== GET TOTAL REVENUE (All Time) ================== */
export const getTotalRevenue = async (req, res) => {
  try {
    const allOrders = await orderModel.find();

    const totalRevenue = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = allOrders.length;
    const totalItems = allOrders.reduce(
      (sum, order) => sum + order.items.reduce((s, item) => s + item.quantity, 0),
      0
    );

    res.status(200).json({
      success: true,
      revenue: totalRevenue, // ✅ Direct number for easier access
      details: { // ✅ Detailed breakdown
        totalRevenue,
        totalOrders,
        totalItems,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      },
    });
  } catch (error) {
    console.error("Get total revenue error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};