import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            unique: true,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        displayName: {
            type: String,
            required: true
        },
        username: {
            type: String,
        },
        avatar: String,
        cover: String,
        bio: String,
        skills: Array,
        reputation: {
            type: Number,
            default: 0
        },
        followers: Array,
        following: Array,
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user'
        },
        emailVerified: {
            type: Boolean,
            default: false
        },
        isBanned: {
            type: Boolean,
            default: false
        },
        bannedReason: String,
        bannedUntil: Date,
        resetPasswordToken: String,
        resetPasswordExpire: Date,
    },
    {
        timestamps: true
    }
);

const User = mongoose.model('User', userSchema, "users");
export default User;