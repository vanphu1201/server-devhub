import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            require: true
        },
        images: Array,
        author: {
            type: String,
            require: true
        },
        likes: Array,
        likesCount: Number,
        comments: Array,
        commentsCount: Number,
        bookmarks: Array,
        bookmarksCount: Number,
        shares: Number,
        visibility: {
            type: String,
            enum: [" public", "private"],
            default: "public"
        }
    },
{
    timestamps: true
}
);

const Post = mongoose.model('Post', postSchema, "users");
export default Post;