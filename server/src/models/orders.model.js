import mongoose from "mongoose";

// ✅ Original Order Schema
const orderSchema = new mongoose.Schema({
  sessionToken: { type: String, required: true },
  tableNumber: { type: Number, required: true },
  items: [
    {
      name: String,
      price: Number,
      quantity: Number,
    },
  ],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "preparing", "served"],  // ✅ Added "pending"
    default: "pending",  // ✅ Changed default
  },
  createdAt: { type: Date, default: Date.now },
});

// ✅ NEW: Top Selling Items Schema
const topSellingItemSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  totalQuantitySold: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  price: { type: Number, required: true },
  timesOrdered: { type: Number, default: 0 }, // How many orders included this item
  lastUpdated: { type: Date, default: Date.now },
});

// ✅ NEW: Sales Analytics Schema (Overall Stats)
const salesAnalyticsSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now }, // Track by date
  totalOrders: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  totalItemsSold: { type: Number, default: 0 },
  averageOrderValue: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
});

// Indexes for better performance
topSellingItemSchema.index({ totalQuantitySold: -1 }); // Sort by most sold
topSellingItemSchema.index({ totalRevenue: -1 }); // Sort by revenue
salesAnalyticsSchema.index({ date: -1 }); // Sort by date

export const orderModel = mongoose.model("Order", orderSchema);
export const topSellingItemModel = mongoose.model("TopSellingItem", topSellingItemSchema);
export const salesAnalyticsModel = mongoose.model("SalesAnalytics", salesAnalyticsSchema);