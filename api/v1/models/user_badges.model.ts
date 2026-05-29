import mongoose from "mongoose";

const userBadgeSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        badge: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Badge',
            required: true
        },
        awardedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

const UserBadge = mongoose.model('UserBadge', userBadgeSchema, "user_badges");
export default UserBadge;
