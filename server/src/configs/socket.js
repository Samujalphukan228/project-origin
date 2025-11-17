import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { employModel } from "../models/employ.Model.js";
import { adminModel } from "../models/admin.model.js"; // ✅ Import admin model

dotenv.config();

export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      console.log('🔐 Socket auth token:', token ? 'Present ✅' : 'Missing ❌');
      
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('🔓 Token decoded, user ID:', decoded.id);
        
        // ✅ Check if user is an admin first
        const admin = await adminModel.findById(decoded.id);
        if (admin && admin.isVerified) {
          socket.user = {
            _id: admin._id,
            email: admin.email,
            role: 'admin',
            isVerified: admin.isVerified
          };
          socket.join(`role:admin`);
          socket.join(`user:${admin._id}`);
          console.log('👤 Admin authenticated:', admin.email, 'role:admin');
          return next();
        }
        
        // ✅ If not admin, check if user is an employee
        const employee = await employModel.findById(decoded.id);
        if (employee && employee.isAproved) {
          socket.user = employee;
          socket.join(`role:${employee.role}`);
          socket.join(`user:${employee._id}`);
          console.log('👤 Employee authenticated:', employee.email, `role:${employee.role}`);
          return next();
        }
        
        console.log('⚠️ User found but not approved/verified');
      } else {
        console.log('⚠️ No token provided, connecting as guest');
      }
      
      next();
    } catch (err) {
      console.error("❌ Socket auth error:", err.message);
      next();
    }
  });

  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id, socket.user?.role || "guest", socket.user?.email || '');

    socket.on("joinTable", (tableNumber) => {
      if (tableNumber) {
        socket.join(`table:${tableNumber}`);
        console.log(`🪑 ${socket.id} joined table ${tableNumber}`);
      }
    });

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected:", socket.id, socket.user?.role || "guest");
    });
  });

  return io;
};