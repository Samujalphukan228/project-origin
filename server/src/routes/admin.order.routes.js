import express from "express";
import {
  getAllOrdersAdmin,
  getOrderByIdAdmin,
  getTopSellingItems,
  getSalesAnalytics,
  getTodaySales,
  getDashboardStats,
  getTotalRevenue,
} from "../controllers/admin.order.controller.js";
import { verifyAdmin } from "../middleware/verifyAdmin.middleware.js";

const adminOrderRouter = express.Router();

// ✅ All routes protected by admin authentication
adminOrderRouter.use(verifyAdmin);

// ✅ Analytics endpoints FIRST (specific routes before dynamic routes)
adminOrderRouter.get("/dashboard-stats", getDashboardStats);
adminOrderRouter.get("/today-sales", getTodaySales);
adminOrderRouter.get("/total-revenue", getTotalRevenue);
adminOrderRouter.get("/top-selling", getTopSellingItems);
adminOrderRouter.get("/sales-analytics", getSalesAnalytics);

// ✅ Order listing endpoints LAST (general routes with params)
adminOrderRouter.get("/", getAllOrdersAdmin);
adminOrderRouter.get("/:id", getOrderByIdAdmin);

export default adminOrderRouter;