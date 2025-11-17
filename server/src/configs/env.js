// server/src/configs/env.js
import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: process.env.PORT || 3000,
  database: process.env.MONGODB_URI,
  mailUser: process.env.EMAIL_USER,
  mailPass: process.env.EMAIL_PASS,
  jwtSecret: process.env.JWT_SECRET,
  adminEmail: process.env.ADMIN_EMAIL,
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudApiKey: process.env.CLOUDINARY_API_KEY,
  cloudApiSecret: process.env.CLOUDINARY_API_SECRET,
};
