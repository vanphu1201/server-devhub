import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
    {
        subject: {
            type: String,
            required: [true, "Vui lòng nhập chủ đề yêu cầu hỗ trợ!"]
        },
        description: {
            type: String,
            required: [true, "Vui lòng nhập mô tả yêu cầu hỗ trợ!"]
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        status: {
            type: String,
            enum: ["open", "resolved", "closed"],
            default: "open"
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium"
        },
        messages: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'TicketMessage'
            }
        ]
    },
    {
        timestamps: true
    }
);

const Ticket = mongoose.model('Ticket', ticketSchema, "tickets");
export default Ticket;
