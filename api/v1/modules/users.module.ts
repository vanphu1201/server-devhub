import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            unique: true,
            require: true,
        },
        password: {
            type: String,
            require: true,
        },
        displayName: {
            type: String,
            require: true
        },
        username: {
            type: String,
            unique: true
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
        email_verified: {
            type: Boolean,
            default: false
        },
        isBanned: {
            type: Boolean,
            default: false
        },
        banned_reason: String,
        banned_until: Date,
    },
    {
        timestamps: true
    }
);

const User = mongoose.model('User', userSchema, "users");
export default User;