// server/src/configs/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import { env } from "./env.js";

const connectCloudinary = async () => {
  cloudinary.config({
    cloud_name: env.cloudName,
    api_key: env.cloudApiKey,
    api_secret: env.cloudApiSecret,
  });

  console.log("✅ Cloudinary connected:", env.cloudName);
};

export default connectCloudinary;
