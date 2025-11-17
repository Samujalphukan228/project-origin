// backend/routes/sessions.routes.js

import express from "express";
import {
  generateTableQR,
  validateSession,
  getActiveTableSessions,
  getAllSessions,
  expireTableSession,
  getSessionStats,
  cleanupOldSessions,
  getAdminAnalytics,
  getWaitersPerformance,
  getAdminTopTables,
  getAdminSessionsStats
} from "../controllers/tableSession.controller.js";
import { verifyWaiter } from "../middleware/verifyWaiter.middleware.js";
import { verifyAdmin } from "../middleware/verifyAdmin.middleware.js";

const router = express.Router();

// Public route - no auth needed
router.get("/validate/:token", validateSession);

// Waiter routes
router.post("/generate", verifyWaiter, generateTableQR);
router.get("/active", verifyWaiter, getActiveTableSessions);
router.get("/stats", verifyWaiter, getSessionStats);

// Admin routes
router.get("/all", verifyAdmin, getAllSessions);
router.put("/:id/expire", verifyAdmin, expireTableSession);
router.delete("/cleanup", verifyAdmin, cleanupOldSessions);
router.get("/admin/analytics", verifyAdmin, getAdminAnalytics);
router.get("/admin/stats", verifyAdmin, getAdminSessionsStats);
router.get("/admin/top-tables", verifyAdmin, getAdminTopTables);
router.get("/admin/waiters-performance", verifyAdmin, getWaitersPerformance);

export default router;