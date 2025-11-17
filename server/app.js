import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./src/configs/DataBase.js";
import connectCloudinary from "./src/configs/cloudinary.js";
import employRouter from "./src/routes/employ.route.js";
import adminRouter from "./src/routes/admin.route.js";
import menuRouter from "./src/routes/menu.routes.js";
import tableSessionRouter from "./src/routes/tableSession.routes.js";
import orderRouter from "./src/routes/order.routes.js";
import adminEmployRouter from "./src/routes/employ.admin.routes.js";
import adminOrderRouter from "./src/routes/admin.order.routes.js";

dotenv.config();

const app = express();

connectDB();
await connectCloudinary();

app.use(cors());
app.use(express.json());

// ✅ Routes
app.use("/api/employ", employRouter);
app.use("/api/admin", adminRouter);
app.use("/api/menu", menuRouter);
app.use("/api/table-session", tableSessionRouter);
app.use("/api/order", orderRouter);
app.use("/api/admin/employ", adminEmployRouter);
app.use("/api/admin/orders", adminOrderRouter);

app.post("/",(req ,res) => {
    res.send("Server is running...")
})

export default app; // ✅ export app only (no server.listen here)
