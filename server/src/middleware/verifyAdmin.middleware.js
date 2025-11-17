import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { adminModel } from "../models/admin.model.js";

dotenv.config(); // ✅ ensures .env is loaded before anything else

export const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ success: false, message: "Access denied: No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await adminModel.findById(decoded.id);

    if (!admin || !admin.isVerified)
      return res.status(403).json({ success: false, message: "Access denied: Invalid admin" });

    req.user = admin;
    req.user.role = "admin";
    next();
  } catch (error) {
    console.error("verifyAdmin error:", error);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};
