import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            default: "VND"
        },
        paymentId: {
            type: String,
            default: ""
        },
        status: {
            type: String,
            enum: ["completed", "failed", "refunded"],
            default: "completed"
        },
        purchaseDate: {
            type: Date,
            default: Date.now
        },
        expiresAt: {
            type: Date
        },
        downloadUrl: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

const Purchase = mongoose.model('Purchase', purchaseSchema, "purchases");
export default Purchase;
