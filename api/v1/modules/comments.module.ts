import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        targetType: String, // blog; post
        targetId: String,
        content: String,
        images: Array,
        likes: Array
    },
    {
        timestamps: true
    }
);

const Comment = mongoose.model('Comment', commentSchema, "comments");
export default Comment;