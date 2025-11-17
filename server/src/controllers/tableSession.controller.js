// backend/controllers/tableSession.controller.js

import QRCode from "qrcode";
import crypto from "crypto";
import { tableSessionModel } from "../models/table.model.js";

export const generateTableQR = async (req, res) => {
  try {
    const { tableNumber } = req.body;
    const waiter = req.user;

    if (!tableNumber) {
      return res
        .status(400)
        .json({ success: false, message: "Table number is required" });
    }

    // Deactivate old sessions for this table
    await tableSessionModel.updateMany(
      { tableNumber, createdBy: waiter._id, isActive: true },
      { isActive: false }
    );

    // Generate session token
    const sessionToken = crypto.randomBytes(16).toString("hex");
    
    // Expires in 30 minutes
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    
    // Delete if unused after 24 hours
    const deleteIfUnusedAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 🔥 CORRECT URL FORMAT: /s/{token}/{table}
    const qrLink = `${process.env.FRONTEND_URL}/s/${sessionToken}/${tableNumber}`;
    
    console.log('✅ Generated QR Link:', qrLink);
    
    // Generate QR code image
    const qrCodeURL = await QRCode.toDataURL(qrLink, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Save to database
    const session = await tableSessionModel.create({
      tableNumber,
      sessionToken,
      qrCodeURL,
      createdBy: waiter._id,
      expiresAt,
      wasUsed: false,
      usageCount: 0,
      deleteIfUnusedAt,
    });

    console.log('✅ Session created:', {
      id: session._id,
      table: tableNumber,
      token: sessionToken.substring(0, 16) + '...',
      url: qrLink
    });

    return res.status(201).json({
      success: true,
      message: `QR generated for Table ${tableNumber}`,
      session: {
        _id: session._id,
        tableNumber: session.tableNumber,
        sessionToken: session.sessionToken,
        qrCodeURL: session.qrCodeURL,
        expiresAt: session.expiresAt,
        isActive: session.isActive,
        createdAt: session.createdAt,
        qrLink: qrLink
      }
    });
  } catch (error) {
    console.error("generateTableQR error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error", error: error.message });
  }
};

export const validateSession = async (req, res) => {
  try {
    const { token } = req.params;

    console.log('🔍 Validating session token:', token.substring(0, 16) + '...');

    const session = await tableSessionModel.findOne({
      sessionToken: token,
      isActive: true,
    });

    if (!session) {
      console.log('❌ Session not found or inactive');
      return res
        .status(400)
        .json({ success: false, valid: false, message: "Invalid or expired QR" });
    }

    // ✅ Check against ORIGINAL expiry time from database
    const now = new Date();
    if (session.expiresAt < now) {
      console.log('❌ Session expired at:', session.expiresAt);
      session.isActive = false;
      await session.save();
      return res.status(400).json({ 
        success: false, 
        valid: false, 
        message: "QR expired" 
      });
    }

    // Mark as used
    if (!session.wasUsed) {
      session.wasUsed = true;
      session.lastUsedAt = new Date();
    }
    session.usageCount += 1;
    await session.save();

    console.log('✅ Session validated successfully:', {
      table: session.tableNumber,
      usageCount: session.usageCount,
      expiresAt: session.expiresAt  // ✅ Log the REAL expiry time
    });

    // ✅ Return the ORIGINAL expiresAt from database!
    return res.status(200).json({
      success: true,
      valid: true,
      tableNumber: session.tableNumber,
      expiresAt: session.expiresAt,  // ✅ From DB, not recalculated!
      sessionToken: session.sessionToken,
      numberOfGuests: session.numberOfGuests || 4,
    });
  } catch (error) {
    console.error("validateSession error:", error);
    return res
      .status(500)
      .json({ 
        success: false, 
        valid: false, 
        message: "Internal server error", 
        error: error.message 
      });
  }
};

export const getActiveTableSessions = async (req, res) => {
  try {
    const waiter = req.user;
    const currentTime = new Date();

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Auto-expire old sessions
    await tableSessionModel.updateMany(
      {
        createdBy: waiter._id,
        isActive: true,
        expiresAt: { $lt: currentTime }  
      },
      {
        $set: { isActive: false }
      }
    );

    const sessions = await tableSessionModel
      .find({ 
        createdBy: waiter._id,
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      })
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${sessions.length} sessions for today`);

    return res.status(200).json({
      success: true,
      count: sessions.length,
      date: startOfDay.toLocaleDateString(),
      sessions, 
    });
  } catch (error) {
    console.error("getActiveTableSessions error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error", error: error.message });
  }
};

export const getAllSessions = async (req, res) => {
  try {
    const { date, startDate, endDate, range } = req.query;
    const currentTime = new Date();

    await tableSessionModel.updateMany(
      {
        isActive: true,
        expiresAt: { $lt: currentTime }
      },
      {
        $set: { isActive: false }
      }
    );

    let dateFilter = {};

    if (range) {
      const now = new Date();
      switch (range) {
        case 'today':
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const todayEnd = new Date();
          todayEnd.setHours(23, 59, 59, 999);
          dateFilter = { createdAt: { $gte: todayStart, $lte: todayEnd } };
          break;
        case 'week':
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - 7);
          dateFilter = { createdAt: { $gte: weekStart } };
          break;
        case 'month':
          const monthStart = new Date();
          monthStart.setDate(monthStart.getDate() - 30);
          dateFilter = { createdAt: { $gte: monthStart } };
          break;
        case 'year':
          const yearStart = new Date();
          yearStart.setFullYear(yearStart.getFullYear() - 1);
          dateFilter = { createdAt: { $gte: yearStart } };
          break;
      }
    } else if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      
      dateFilter = { createdAt: { $gte: start, $lte: end } };
    } else if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const endToday = new Date();
      endToday.setHours(23, 59, 59, 999);
      
      dateFilter = { createdAt: { $gte: today, $lte: endToday } };
    }

    const sessions = await tableSessionModel
      .find(dateFilter)
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    console.error("getAllSessions error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error", error: error.message });
  }
};

export const expireTableSession = async (req, res) => {
  try {
    const { id } = req.params;

    const session = await tableSessionModel.findById(id);
    if (!session)
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });

    session.isActive = false;
    await session.save();

    return res.status(200).json({
      success: true,
      message: `Session for table ${session.tableNumber} expired manually`,
    });
  } catch (error) {
    console.error("expireTableSession error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error", error: error.message });
  }
};

export const getSessionStats = async (req, res) => {
  try {
    const waiter = req.user;
    const currentTime = new Date();

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    await tableSessionModel.updateMany(
      {
        createdBy: waiter._id,
        isActive: true,
        expiresAt: { $lt: currentTime }
      },
      {
        $set: { isActive: false }
      }
    );

    const totalToday = await tableSessionModel.countDocuments({
      createdBy: waiter._id,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const activeToday = await tableSessionModel.countDocuments({
      createdBy: waiter._id,
      isActive: true,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const usedToday = await tableSessionModel.countDocuments({
      createdBy: waiter._id,
      wasUsed: true,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const unusedToday = totalToday - usedToday;
    const expiredToday = totalToday - activeToday;

    const topTables = await tableSessionModel.aggregate([
      {
        $match: {
          createdBy: waiter._id,
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $group: {
          _id: "$tableNumber",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);

    return res.status(200).json({
      success: true,
      date: startOfDay.toLocaleDateString(),
      stats: {
        totalToday,
        activeToday,
        expiredToday,
        usedToday,
        unusedToday,
        topTables
      }
    });
  } catch (error) {
    console.error("getSessionStats error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error", error: error.message });
  }
};

export const cleanupOldSessions = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const result = await tableSessionModel.deleteMany({
      createdAt: { $lt: cutoffDate },
      wasUsed: false
    });

    return res.status(200).json({
      success: true,
      message: `Cleaned up ${result.deletedCount} unused sessions`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("cleanupOldSessions error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error", error: error.message });
  }
};

export const getAdminAnalytics = async (req, res) => {
  try {
    const { range = 'today' } = req.query;
    const currentTime = new Date();

    await tableSessionModel.updateMany(
      {
        isActive: true,
        expiresAt: { $lt: currentTime }
      },
      {
        $set: { isActive: false }
      }
    );
    
    let dateFilter = {};
    
    switch (range) {
      case 'today':
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
        break;
      case 'week':
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - 7);
        dateFilter = { createdAt: { $gte: startOfWeek } };
        break;
      case 'month':
        const startOfMonth = new Date();
        startOfMonth.setDate(startOfMonth.getDate() - 30);
        dateFilter = { createdAt: { $gte: startOfMonth } };
        break;
      case 'year':
        const startOfYear = new Date();
        startOfYear.setFullYear(startOfYear.getFullYear() - 1);
        dateFilter = { createdAt: { $gte: startOfYear } };
        break;
    }

    const totalSessions = await tableSessionModel.countDocuments(dateFilter);
    const activeSessions = await tableSessionModel.countDocuments({ 
      ...dateFilter, 
      isActive: true 
    });

    const usedSessions = await tableSessionModel.countDocuments({
      ...dateFilter,
      wasUsed: true
    });

    const unusedSessions = totalSessions - usedSessions;

    const activeWaiters = await tableSessionModel.distinct('createdBy', {
      ...dateFilter,
      isActive: true
    });

    const uniqueTables = await tableSessionModel.distinct('tableNumber', dateFilter);

    return res.status(200).json({
      success: true,
      analytics: {
        totalSessions,
        activeSessions,
        expiredSessions: totalSessions - activeSessions,
        usedSessions,
        unusedSessions,
        usageRate: totalSessions > 0 ? ((usedSessions / totalSessions) * 100).toFixed(1) + '%' : '0%',
        activeWaitersCount: activeWaiters.length,
        uniqueTablesUsed: uniqueTables.length,
        range
      }
    });
  } catch (error) {
    console.error("getAdminAnalytics error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error", 
      error: error.message 
    });
  }
};

export const getWaitersPerformance = async (req, res) => {
  try {
    const { range = 'today' } = req.query;
    const currentTime = new Date();

    await tableSessionModel.updateMany(
      {
        isActive: true,
        expiresAt: { $lt: currentTime }
      },
      {
        $set: { isActive: false }
      }
    );
    
    let dateFilter = {};
    
    switch (range) {
      case 'today':
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
        break;
      case 'week':
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - 7);
        dateFilter = { createdAt: { $gte: startOfWeek } };
        break;
      case 'month':
        const startOfMonth = new Date();
        startOfMonth.setDate(startOfMonth.getDate() - 30);
        dateFilter = { createdAt: { $gte: startOfMonth } };
        break;
      case 'year':
        const startOfYear = new Date();
        startOfYear.setFullYear(startOfYear.getFullYear() - 1);
        dateFilter = { createdAt: { $gte: startOfYear } };
        break;
    }

    const waiterStats = await tableSessionModel.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$createdBy",
          totalSessions: { $sum: 1 },
          activeSessions: {
            $sum: { $cond: ["$isActive", 1, 0] }
          },
          usedSessions: {
            $sum: { $cond: ["$wasUsed", 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: "employees",
          localField: "_id",
          foreignField: "_id",
          as: "waiterInfo"
        }
      },
      {
        $unwind: "$waiterInfo"
      },
      {
        $project: {
          _id: 1,
          name: "$waiterInfo.name",
          email: "$waiterInfo.email",
          totalSessions: 1,
          activeSessions: 1,
          usedSessions: 1,
          unusedSessions: { $subtract: ["$totalSessions", "$usedSessions"] },
          usageRate: {
            $cond: [
              { $gt: ["$totalSessions", 0] },
              { $multiply: [{ $divide: ["$usedSessions", "$totalSessions"] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { totalSessions: -1 } }
    ]);

    return res.status(200).json({
      success: true,
      waiters: waiterStats,
      range
    });
  } catch (error) {
    console.error("getWaitersPerformance error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error", 
      error: error.message 
    });
  }
};

export const getAdminTopTables = async (req, res) => {
  try {
    const { limit = 10, range = 'today' } = req.query;
    
    let dateFilter = {};
    
    switch (range) {
      case 'today':
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
        break;
      case 'week':
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - 7);
        dateFilter = { createdAt: { $gte: startOfWeek } };
        break;
      case 'month':
        const startOfMonth = new Date();
        startOfMonth.setDate(startOfMonth.getDate() - 30);
        dateFilter = { createdAt: { $gte: startOfMonth } };
        break;
      case 'year':
        const startOfYear = new Date();
        startOfYear.setFullYear(startOfYear.getFullYear() - 1);
        dateFilter = { createdAt: { $gte: startOfYear } };
        break;
    }

    const topTables = await tableSessionModel.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$tableNumber",
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: ["$isActive", 1, 0] }
          },
          usedCount: {
            $sum: { $cond: ["$wasUsed", 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) }
    ]);

    return res.status(200).json({
      success: true,
      tables: topTables,
      range
    });
  } catch (error) {
    console.error("getAdminTopTables error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error", 
      error: error.message 
    });
  }
};

export const getAdminSessionsStats = async (req, res) => {
  try {
    const { range = 'today' } = req.query;
    const currentTime = new Date();

    await tableSessionModel.updateMany(
      {
        isActive: true,
        expiresAt: { $lt: currentTime }
      },
      {
        $set: { isActive: false }
      }
    );
    
    let dateFilter = {};
    
    switch (range) {
      case 'today':
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
        break;
      case 'week':
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - 7);
        dateFilter = { createdAt: { $gte: startOfWeek } };
        break;
      case 'month':
        const startOfMonth = new Date();
        startOfMonth.setDate(startOfMonth.getDate() - 30);
        dateFilter = { createdAt: { $gte: startOfMonth } };
        break;
      case 'year':
        const startOfYear = new Date();
        startOfYear.setFullYear(startOfYear.getFullYear() - 1);
        dateFilter = { createdAt: { $gte: startOfYear } };
        break;
    }

    const total = await tableSessionModel.countDocuments(dateFilter);
    const active = await tableSessionModel.countDocuments({ 
      ...dateFilter, 
      isActive: true 
    });
    const expired = total - active;
    
    const used = await tableSessionModel.countDocuments({
      ...dateFilter,
      wasUsed: true
    });
    const unused = total - used;

    return res.status(200).json({
      success: true,
      stats: {
        total,
        active,
        expired,
        used,
        unused,
        usageRate: total > 0 ? ((used / total) * 100).toFixed(1) + '%' : '0%',
        range
      }
    });
  } catch (error) {
    console.error("getAdminSessionsStats error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error", 
      error: error.message 
    });
  }
};