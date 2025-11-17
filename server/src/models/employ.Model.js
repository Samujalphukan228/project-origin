import mongoose from "mongoose";

const employSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["waiter", "kitchen", "pending"],  // ✅ Removed "manager"
    default: "pending",
  },
  isAproved: { type: Boolean, default: false },        // admin approval
  isVerified: { type: Boolean, default: false },       // email verified after OTP
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" }, // who created (optional)
  otp: { type: String },
  otpExpires: { type: Date },
  otpPurpose: { type: String },
});

export const employModel = mongoose.models.Employee || mongoose.model("Employee", employSchema);