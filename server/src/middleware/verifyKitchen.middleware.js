import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { employModel } from "../models/employ.model.js";

dotenv.config();

export const verifyKitchen = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ success: false, message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await employModel.findById(decoded.id);

    if (!user || !user.isAproved)
      return res.status(403).json({ success: false, message: "Unauthorized user" });

    if (!["kitchen", "manager", "admin"].includes(user.role))
      return res.status(403).json({ success: false, message: "Access denied" });

    req.user = user;
    next();
  } catch (error) {
    console.error("verifyKitchen error:", error);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};
