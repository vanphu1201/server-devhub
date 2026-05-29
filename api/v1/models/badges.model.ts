import mongoose from "mongoose";

const badgeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Vui lòng nhập tên huy hiệu!"],
            unique: true
        },
        icon: {
            type: String,
            required: [true, "Vui lòng tải lên icon huy hiệu!"]
        },
        description: {
            type: String,
            required: [true, "Vui lòng nhập mô tả huy hiệu!"]
        }
    },
    {
        timestamps: true
    }
);

const Badge = mongoose.model('Badge', badgeSchema, "badges");
export default Badge;
