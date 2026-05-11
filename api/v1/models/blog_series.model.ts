import mongoose from "mongoose";
const slugUpdater = require('mongoose-slug-updater');
mongoose.plugin(slugUpdater);

const blogSeriesSchema = new mongoose.Schema(
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
        description: { 
            type: String, 
        },
        image: { 
            type: String,
            default: ""
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        status: {
            type: String,
            enum: ["draft", "pending", "approved", "rejected"],
            default: "draft"
        },
        posts: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'BlogPost'
        },
    },
    {
        timestamps: true
    }
);

const BlogSeries = mongoose.model('BlogSeries', blogSeriesSchema, "blog_series");
export default BlogSeries;