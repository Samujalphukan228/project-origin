import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { employModel } from "../models/employ.model.js";

dotenv.config();

export const verifyWaiter = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ success: false, message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const employee = await employModel.findById(decoded.id);

    if (!employee || !employee.isAproved)
      return res.status(403).json({ success: false, message: "Access denied" });

    if (employee.role !== "waiter" && employee.role !== "manager" && employee.role !== "admin")
      return res.status(403).json({ success: false, message: "Only waiter or higher roles allowed" });

    req.user = employee;
    next();
  } catch (error) {
    console.error("verifyWaiter error:", error);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};
