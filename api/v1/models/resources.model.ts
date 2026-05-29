import mongoose from "mongoose";
import slugify from "slugify";

const resourceSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Vui lòng nhập tiêu đề tài nguyên!"]
        },
        slug: {
            type: String,
            unique: true
        },
        description: {
            type: String,
            required: [true, "Vui lòng nhập mô tả tài nguyên!"]
        },
        type: {
            type: String,
            enum: ["pdf", "code", "image", "video"],
            required: [true, "Vui lòng chọn kiểu tài nguyên!"]
        },
        fileUrl: {
            type: String,
            required: [true, "Vui lòng cung cấp link file tài nguyên!"]
        },
        isPremium: {
            type: Boolean,
            default: false
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        downloads: {
            type: Number,
            default: 0
        },
        rating: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

resourceSchema.pre("save", function(this: any, next: any) {
    if (this.isModified("title")) {
        this.slug = slugify(this.title, { lower: true, strict: true }) + "-" + Math.floor(Math.random() * 10000);
    }
    next();
});

const Resource = mongoose.model('Resource', resourceSchema, "resources");
export default Resource;
