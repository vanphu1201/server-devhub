import mongoose from "mongoose";

const ticketMessageSchema = new mongoose.Schema(
    {
        ticket: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Ticket',
            required: true
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        content: {
            type: String,
            required: [true, "Vui lòng nhập nội dung tin nhắn!"]
        },
        isAdmin: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

const TicketMessage = mongoose.model('TicketMessage', ticketMessageSchema, "ticket_messages");
export default TicketMessage;
