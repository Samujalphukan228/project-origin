import mongoose from 'mongoose';


const menuSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: [String], required: true },
    bestseller: { type: Boolean, default: false },
    date: { type: Number, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isApproved: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    rejectionReason: { type: String }
});

export const menuModel = mongoose.model('Menu', menuSchema);
