import express from "express";
import {
  placeOrder,
  getOrdersByTable,
  updateOrderStatus,
  getAllOrders,
  cancelOrder,
  getActiveOrdersCount,
} from "../controllers/order.controller.js";
import { verifyKitchen } from "../middleware/verifyKitchen.middleware.js";

const orderRouter = express.Router();


orderRouter.post("/place", placeOrder);
orderRouter.get("/all", verifyKitchen, getAllOrders);
orderRouter.get("/stats", verifyKitchen, getActiveOrdersCount);
orderRouter.get("/table/:tableNumber", getOrdersByTable);
orderRouter.put("/:id/status", verifyKitchen, updateOrderStatus);
orderRouter.delete("/:id", verifyKitchen, cancelOrder);

export default orderRouter;