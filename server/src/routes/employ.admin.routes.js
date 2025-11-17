import express from "express";
import {
  adminApproveEmployee,
  adminGetAllEmployees,
  adminRejectEmployee,
  adminDeleteEmployee,
  updateEmployeeRole,
} from "../controllers/employ.admin.controller.js";

import { verifyAdmin } from "../middleware/verifyAdmin.middleware.js";

const adminEmployRouter = express.Router();

// ✅ Admin can give final approval
adminEmployRouter.put("/:id/approve", verifyAdmin, adminApproveEmployee);

// ✅ Admin can update an employee's role
adminEmployRouter.put("/:id/role", verifyAdmin, updateEmployeeRole);

// ✅ Admin can view all employees
adminEmployRouter.get("/", verifyAdmin, adminGetAllEmployees);

// ✅ Admin can reject an employee
adminEmployRouter.put("/:id/reject", verifyAdmin, adminRejectEmployee);

// ✅ Admin can delete employee entirely
adminEmployRouter.delete("/:id", verifyAdmin, adminDeleteEmployee);

export default adminEmployRouter;