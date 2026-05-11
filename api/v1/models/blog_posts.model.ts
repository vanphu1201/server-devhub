import mongoose from "mongoose";
const slugUpdater = require('mongoose-slug-updater');
mongoose.plugin(slugUpdater);

const blogPostsSchema = new mongoose.Schema(
    {
        title: { 
            type: String, 
            required: [true, "Vui lòng nhập tiêu đề bài viết!"] 
        },
        slug: {
            type: String,
            unique: true,
            slug: "title"
        },
        content: { 
            type: String, 
            required: [true, "Vui lòng nhập nội dung bài viết!"] 
        },
        excerpt: { 
            type: String,
            default: ""
        },
        images: { 
            type: String,
            default: ""
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        category: String,
        tags: Array,
        status: {
            type: String,
            enum: ["draft", "pending", "approved", "rejected"],
            default: "draft"
        },
        readTime: {
            type: Number,
            default: 0
        },
        views: {
            type: Number,
            default: 0
        },
        likes: {
            type: Array,
            default: []
        },
        bookmarks: {
            type: Array,
            default: []
        },
        comments: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment'
        },
        series: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Series'
        },
    },
    {
        timestamps: true
    }
);

const BlogPost = mongoose.model('BlogPost', blogPostsSchema, "blog_posts");
export default BlogPost;