import mongoose from "mongoose";

const resourceUnlockSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        resource: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Resource',
            required: true
        },
        unlockedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

const ResourceUnlock = mongoose.model('ResourceUnlock', resourceUnlockSchema, "resource_unlocks");
export default ResourceUnlock;
