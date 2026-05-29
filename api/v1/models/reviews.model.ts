import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            required: true
        },
        content: {
            type: String,
            required: true
        },
        helpful: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

const Review = mongoose.model('Review', reviewSchema, "reviews");
export default Review;
