import { employModel } from "../models/employ.model.js";

/* ---------------- Manager preliminary approval ---------------- */
export const managerApproveEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const manager = req.user;
    const io = req.app.get("io"); // ✅ get socket instance

    const employee = await employModel.findById(id);
    if (!employee)
      return res.status(404).json({ success: false, message: "Employee not found" });

    if (employee.managerApproved)
      return res.status(400).json({ success: false, message: "Already approved by manager" });

    employee.managerApproved = true;
    employee.managerApprovedBy = manager._id;
    employee.managerApprovedAt = Date.now();
    await employee.save();

    // ✅ Notify ONLY admins (not everyone!)
    io.to("role:admin").emit("employee:managerApproved", {
      id: employee._id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      managerApprovedBy: manager.name || manager._id,
      managerApprovedAt: employee.managerApprovedAt
    });

    return res.status(200).json({
      success: true,
      message: "Employee preliminarily approved by manager",
      employee,
    });
  } catch (error) {
    console.error("managerApproveEmployee error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ---------------- Admin final approval ---------------- */
export const adminApproveEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const io = req.app.get("io");

    const employee = await employModel.findById(id);
    if (!employee)
      return res.status(404).json({ success: false, message: "Employee not found" });

    employee.isAproved = true;
    employee.adminApprovedAt = Date.now();
    await employee.save();

    // ✅ Notify managers AND admins (not everyone!)
    io.to("role:manager").to("role:admin").emit("employee:approved", {
      id: employee._id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      isAproved: true,
      adminApprovedAt: employee.adminApprovedAt
    });

    // ✅ Notify the specific employee
    io.to(`user:${employee._id}`).emit("account:approved", {
      message: "Your account has been approved!",
      isAproved: true
    });

    return res.status(200).json({
      success: true,
      message: "Employee approved by admin (final)",
      employee,
    });
  } catch (error) {
    console.error("adminApproveEmployee error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ---------------- Admin get all employees ---------------- */
export const adminGetAllEmployees = async (req, res) => {
  try {
    const employees = await employModel.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: employees.length, employees });
  } catch (error) {
    console.error("adminGetAllEmployees error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ---------------- Admin get manager-approved employees ---------------- */
export const adminGetManagerApproved = async (req, res) => {
  try {
    const employees = await employModel
      .find({ managerApproved: true, isAproved: false })
      .populate("managerApprovedBy", "name email role");

    return res.status(200).json({ success: true, count: employees.length, employees });
  } catch (error) {
    console.error("adminGetManagerApproved error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ---------------- Admin reject employee ---------------- */
export const adminRejectEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const io = req.app.get("io");

    const employee = await employModel.findById(id);
    if (!employee)
      return res.status(404).json({ success: false, message: "Employee not found" });

    // ✅ Notify the specific employee before deletion
    io.to(`user:${employee._id}`).emit("account:rejected", {
      message: "Your account has been rejected",
      reason: reason || "No reason provided"
    });

    await employModel.findByIdAndDelete(id);

    // ✅ Notify only managers & admins (not everyone!)
    io.to("role:manager").to("role:admin").emit("employee:rejected", { 
      id, 
      name: employee.name,
      email: employee.email,
      reason: reason || "No reason provided" 
    });

    return res.status(200).json({
      success: true,
      message: "Employee rejected and removed",
      reason: reason || "No reason provided",
    });
  } catch (error) {
    console.error("adminRejectEmployee error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ---------------- Admin delete employee ---------------- */
export const adminDeleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const io = req.app.get("io");

    const employee = await employModel.findById(id);
    if (!employee)
      return res.status(404).json({ success: false, message: "Employee not found" });

    // ✅ Notify the specific employee before deletion
    io.to(`user:${employee._id}`).emit("account:deleted", {
      message: "Your account has been deleted by an administrator"
    });

    await employModel.findByIdAndDelete(id);

    // ✅ Notify only admins (not everyone!)
    io.to("role:admin").emit("employee:deleted", { 
      id,
      name: employee.name,
      email: employee.email
    });

    return res.status(200).json({ success: true, message: "Employee deleted successfully" });
  } catch (error) {
    console.error("adminDeleteEmployee error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ---------------- Admin update employee role ---------------- */
export const updateEmployeeRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const io = req.app.get("io");

    const validRoles = ["manager", "waiter", "kitchen", "pending"];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid or missing role" });
    }

    const employee = await employModel.findById(id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const oldRole = employee.role;
    employee.role = role;
    employee.isAproved = role === "pending" ? false : true;
    await employee.save();

    // ✅ Notify only admins (not everyone!)
    io.to("role:admin").emit("employee:roleUpdated", {
      id: employee._id,
      name: employee.name,
      email: employee.email,
      oldRole,
      newRole: role,
      isAproved: employee.isAproved
    });

    // ✅ Notify the specific employee
    io.to(`user:${employee._id}`).emit("role:changed", {
      message: `Your role has been changed from ${oldRole} to ${role}`,
      oldRole,
      newRole: role,
      isAproved: employee.isAproved
    });

    return res.status(200).json({
      success: true,
      message: `Employee role updated to '${role}'`,
      employee,
    });
  } catch (error) {
    console.error("updateEmployeeRole error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};