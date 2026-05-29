import mongoose from "mongoose";
import slugify from "slugify";

const productSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Vui lòng nhập tiêu đề sản phẩm!"]
        },
        slug: {
            type: String,
            unique: true
        },
        description: {
            type: String,
            required: [true, "Vui lòng nhập mô tả sản phẩm!"]
        },
        image: {
            type: String,
            required: [true, "Vui lòng tải ảnh sản phẩm lên!"]
        },
        price: {
            type: Number,
            required: [true, "Vui lòng nhập giá sản phẩm!"]
        },
        currency: {
            type: String,
            enum: ["USD", "EUR", "VND"],
            default: "VND"
        },
        category: {
            type: String,
            enum: ["templates", "code", "tools", "courses"],
            required: [true, "Vui lòng chọn loại sản phẩm!"]
        },
        tags: [String],
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        downloadUrl: {
            type: String,
            required: [true, "Vui lòng nhập link tải về!"]
        },
        preview: {
            type: String,
            default: ""
        },
        status: {
            type: String,
            enum: ["draft", "pending", "approved"],
            default: "approved"
        },
        sales: {
            type: Number,
            default: 0
        },
        rating: {
            type: Number,
            default: 0
        },
        reviews: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Review'
            }
        ]
    },
    {
        timestamps: true
    }
);

productSchema.pre("save", function(this: any, next: any) {
    if (this.isModified("title")) {
        this.slug = slugify(this.title, { lower: true, strict: true }) + "-" + Math.floor(Math.random() * 10000);
    }
    next();
});

const Product = mongoose.model('Product', productSchema, "products");
export default Product;
