import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: true
        },
        images: Array,
        author: {
            type: String,
            required: true
        },
        likes: Array,
        likesCount: Number,
        comments: Array,
        commentsCount: {
            type: Number,
            default: 0
        },
        bookmarks: Array,
        bookmarksCount: {
            type: Number,
            default: 0
        },
        shares: {
            type: Number,
            default: 0
        },
        visibility: {
            type: String,
            enum: ["public", "private"],
            default: "public"
        }
    },
{
    timestamps: true
}
);

const Post = mongoose.model('Post', postSchema, "posts");
export default Post;