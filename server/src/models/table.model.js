import mongoose from "mongoose";

const tableSessionSchema = new mongoose.Schema({
  tableNumber: { 
    type: Number, 
    required: true 
  },
  sessionToken: { 
    type: String, 
    required: true, 
    unique: true 
  },
  qrCodeURL: { 
    type: String, 
    required: true 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Employee", 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  expiresAt: { 
    type: Date, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  
  wasUsed: {
    type: Boolean,
    default: false,
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  lastUsedAt: {
    type: Date,
    default: null,
  },

  deleteIfUnusedAt: {
    type: Date,
    required: true,
    default: function() {
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  }
});

tableSessionSchema.index(
  { deleteIfUnusedAt: 1 }, 
  { 
    expireAfterSeconds: 0,
    partialFilterExpression: { wasUsed: false } // ✅ KEY: Only unused
  }
);

// Other indexes for performance
tableSessionSchema.index({ sessionToken: 1 });
tableSessionSchema.index({ tableNumber: 1 });
tableSessionSchema.index({ createdBy: 1 });
tableSessionSchema.index({ isActive: 1 });
tableSessionSchema.index({ wasUsed: 1 });
tableSessionSchema.index({ createdAt: -1 });

export const tableSessionModel =
  mongoose.models.TableSession || mongoose.model("TableSession", tableSessionSchema);