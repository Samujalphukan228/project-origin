import express from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import {
  addMenu,
  getAllMenus,
  getMenuById,
  updateMenu,
  deleteMenu,
  approveMenu,
  rejectMenu,
  getPublicMenus,
} from "../controllers/menu.controller.js";
import { verifyAdmin } from "../middleware/verifyAdmin.middleware.js";

const menuRouter = express.Router();
const upload = multer({ dest: "uploads/" });

/* ------------------------- RATE LIMITERS ------------------------- */
const addMenuLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many add menu requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const updateMenuLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many update requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const deleteMenuLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: "Too many delete attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ------------------------- ROUTES ------------------------- */

// ⚠️ IMPORTANT: Specific routes MUST come BEFORE parameterized routes!

// ✅ PUBLIC ROUTES (Before /:id)
menuRouter.get("/public", getPublicMenus);

// ✅ ADMIN ROUTES - View all menus (protected)
menuRouter.get("/all", verifyAdmin, getAllMenus);

// ✅ ADMIN - Add menu
menuRouter.post(
  "/add",
  verifyAdmin,
  addMenuLimiter,
  upload.fields([
    { name: "image1" },
    { name: "image2" },
    { name: "image3" },
    { name: "image4" },
  ]),
  addMenu
);

// ✅ ADMIN - Approve/Reject (Before /:id routes!)
menuRouter.put("/:id/approve", verifyAdmin, approveMenu);
menuRouter.put("/:id/reject", verifyAdmin, rejectMenu);

// ✅ ADMIN - Update menu
menuRouter.put(
  "/:id",
  verifyAdmin,
  updateMenuLimiter,
  upload.fields([
    { name: "image1" },
    { name: "image2" },
    { name: "image3" },
    { name: "image4" },
  ]),
  updateMenu
);

// ✅ ADMIN - Delete menu
menuRouter.delete("/:id", verifyAdmin, deleteMenuLimiter, deleteMenu);

// ✅ PUBLIC - Get menu by ID (MUST BE LAST!)
menuRouter.get("/:id", getMenuById);

export default menuRouter;