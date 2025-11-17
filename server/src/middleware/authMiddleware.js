import jwt from "jsonwebtoken";
import { adminModel } from "../models/admin.model.js"; // or wherever your admin model is

// Middleware to verify admin
export const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await adminModel.findById(decoded.id);

    if (!admin) {
      return res.status(403).json({ success: false, message: "Access denied. Admins only." });
    }

    req.user = admin;
    req.user.role = "admin";
    next();
  } catch (error) {
    console.error("verifyAdmin error:", error);
    return res.status(403).json({ success: false, message: "Invalid or expired token" });
  }
};
