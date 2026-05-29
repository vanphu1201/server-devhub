import { Response } from "express";
import { ExtendRequest } from "../../../helpers/extendRequest";
import Ticket from "../models/tickets.model";
import TicketMessage from "../models/ticket_messages.model";
import mongoose from "mongoose";

// [POST] /api/v1/tickets
export const createTicket = async (req: ExtendRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { subject, description, productId, priority } = req.body;

        if (!subject || !description) {
            res.status(400).json({ success: false, error: "Vui lòng nhập chủ đề và nội dung yêu cầu hỗ trợ!" });
            return;
        }

        const newTicket = new Ticket({
            subject: subject.trim(),
            description: description,
            user: userId,
            product: mongoose.isValidObjectId(productId) ? productId : undefined,
            priority: priority || "medium",
            status: "open",
            messages: []
        });

        await newTicket.save();

        res.status(201).json({
            success: true,
            data: {
                id: newTicket._id,
                subject: newTicket.subject,
                status: newTicket.status,
                createdAt: newTicket.createdAt
            }
        });

    } catch (error) {
        console.error("[Create Ticket Error]: ", error);
        res.status(500).json({ success: false, error: "Lỗi hệ thống khi tạo yêu cầu hỗ trợ!" });
    }
};

// [GET] /api/v1/tickets
export const getTickets = async (req: ExtendRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;

        const [tickets, total] = await Promise.all([
            Ticket.find({ user: userId })
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit)
                .populate("product", "title slug image")
                .lean(),
            Ticket.countDocuments({ user: userId })
        ]);

        const formattedTickets = tickets.map((t: any) => ({
            id: t._id,
            subject: t.subject,
            status: t.status,
            priority: t.priority,
            product: t.product,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt
        }));

        res.status(200).json({
            success: true,
            data: {
                items: formattedTickets,
                total: total
            }
        });

    } catch (error) {
        console.error("[Get Tickets Error]: ", error);
        res.status(500).json({ success: false, error: "Lỗi hệ thống khi lấy danh sách yêu cầu hỗ trợ!" });
    }
};

// [GET] /api/v1/tickets/:ticketId
export const getTicket = async (req: ExtendRequest, res: Response) => {
    try {
        const { ticketId } = req.params;
        const userId = req.user?.id;
        const role = req.user?.role;

        if (!mongoose.isValidObjectId(ticketId)) {
            res.status(400).json({ success: false, error: "ID yêu cầu hỗ trợ không hợp lệ!" });
            return;
        }

        const ticket = await Ticket.findById(ticketId)
            .populate("product", "title slug image price")
            .populate("user", "displayName email avatar")
            .lean();

        if (!ticket) {
            res.status(404).json({ success: false, error: "Yêu cầu hỗ trợ không tồn tại!" });
            return;
        }

        // Chỉ tác giả ticket hoặc Admin mới được xem
        if (ticket.user._id.toString() !== userId.toString() && role !== 'admin') {
            res.status(403).json({ success: false, error: "Bạn không có quyền xem yêu cầu hỗ trợ này!" });
            return;
        }

        res.status(200).json({
            success: true,
            data: {
                id: ticket._id,
                subject: ticket.subject,
                description: ticket.description,
                user: ticket.user,
                product: ticket.product,
                status: ticket.status,
                priority: ticket.priority,
                createdAt: ticket.createdAt,
                updatedAt: ticket.updatedAt
            }
        });

    } catch (error) {
        console.error("[Get Single Ticket Error]: ", error);
        res.status(500).json({ success: false, error: "Lỗi hệ thống khi lấy chi tiết yêu cầu hỗ trợ!" });
    }
};

// [POST] /api/v1/tickets/:ticketId/messages
export const replyTicket = async (req: ExtendRequest, res: Response) => {
    try {
        const { ticketId } = req.params;
        const userId = req.user?.id;
        const role = req.user?.role;
        const { content } = req.body;

        if (!content || !content.trim()) {
            res.status(400).json({ success: false, error: "Vui lòng nhập nội dung phản hồi!" });
            return;
        }

        if (!mongoose.isValidObjectId(ticketId)) {
            res.status(400).json({ success: false, error: "ID yêu cầu hỗ trợ không hợp lệ!" });
            return;
        }

        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            res.status(404).json({ success: false, error: "Yêu cầu hỗ trợ không tồn tại!" });
            return;
        }

        // Check quyền
        if (ticket.user.toString() !== userId.toString() && role !== 'admin') {
            res.status(403).json({ success: false, error: "Bạn không có quyền phản hồi yêu cầu hỗ trợ này!" });
            return;
        }

        const newMessage = new TicketMessage({
            ticket: ticketId,
            author: userId,
            content: content.trim(),
            isAdmin: role === 'admin'
        });

        await newMessage.save();

        // Thêm tin nhắn vào mảng của Ticket
        ticket.messages.push(newMessage._id as any);
        
        // Nếu Admin trả lời, tự động chuyển trạng thái hoặc cập nhật
        if (role === 'admin') {
            ticket.status = "open"; // Giữ trạng thái open hoặc có thể tùy biến
        }
        await ticket.save();

        res.status(201).json({
            success: true,
            data: {
                id: newMessage._id,
                content: newMessage.content,
                isAdmin: newMessage.isAdmin,
                createdAt: newMessage.createdAt
            }
        });

    } catch (error) {
        console.error("[Reply Ticket Error]: ", error);
        res.status(500).json({ success: false, error: "Lỗi hệ thống khi phản hồi tin nhắn!" });
    }
};

// [GET] /api/v1/tickets/:ticketId/messages
export const getTicketMessages = async (req: ExtendRequest, res: Response) => {
    try {
        const { ticketId } = req.params;
        const userId = req.user?.id;
        const role = req.user?.role;

        if (!mongoose.isValidObjectId(ticketId)) {
            res.status(400).json({ success: false, error: "ID yêu cầu hỗ trợ không hợp lệ!" });
            return;
        }

        const ticket = await Ticket.findById(ticketId).lean();
        if (!ticket) {
            res.status(404).json({ success: false, error: "Yêu cầu hỗ trợ không tồn tại!" });
            return;
        }

        // Check quyền
        if (ticket.user.toString() !== userId.toString() && role !== 'admin') {
            res.status(403).json({ success: false, error: "Bạn không có quyền xem tin nhắn của yêu cầu hỗ trợ này!" });
            return;
        }

        const messages = await TicketMessage.find({ ticket: ticketId })
            .sort({ createdAt: 1 }) // Tin nhắn cũ trước, mới sau để đọc từ trên xuống dưới
            .populate("author", "displayName avatar role")
            .lean();

        const formattedMessages = messages.map((m: any) => ({
            id: m._id,
            author: m.author,
            content: m.content,
            isAdmin: m.isAdmin,
            createdAt: m.createdAt
        }));

        res.status(200).json({
            success: true,
            data: formattedMessages
        });

    } catch (error) {
        console.error("[Get Ticket Messages Error]: ", error);
        res.status(500).json({ success: false, error: "Lỗi hệ thống khi lấy tin nhắn hội thoại!" });
    }
};

// [GET] /api/v1/tickets/admin/all
export const getAdminAllTickets = async (req: ExtendRequest, res: Response) => {
    try {
        const status = req.query.status as string;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;

        const query: any = {};
        if (status && ["open", "resolved", "closed"].includes(status)) {
            query.status = status;
        }

        const [tickets, total] = await Promise.all([
            Ticket.find(query)
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit)
                .populate("user", "displayName email avatar")
                .populate("product", "title slug")
                .lean(),
            Ticket.countDocuments(query)
        ]);

        const formattedTickets = tickets.map((t: any) => ({
            id: t._id,
            subject: t.subject,
            description: t.description,
            user: t.user,
            product: t.product,
            status: t.status,
            priority: t.priority,
            createdAt: t.createdAt
        }));

        res.status(200).json({
            success: true,
            data: {
                items: formattedTickets,
                total: total
            }
        });

    } catch (error) {
        console.error("[Admin Get Tickets Error]: ", error);
        res.status(500).json({ success: false, error: "Lỗi hệ thống khi lấy danh sách khiếu nại của Admin!" });
    }
};

// [PUT] /api/v1/tickets/:ticketId/status
export const updateTicketStatus = async (req: ExtendRequest, res: Response) => {
    try {
        const { ticketId } = req.params;
        const { status } = req.body;

        if (!status || !["open", "resolved", "closed"].includes(status)) {
            res.status(400).json({ success: false, error: "Trạng thái cập nhật không hợp lệ!" });
            return;
        }

        if (!mongoose.isValidObjectId(ticketId)) {
            res.status(400).json({ success: false, error: "ID yêu cầu hỗ trợ không hợp lệ!" });
            return;
        }

        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            res.status(404).json({ success: false, error: "Yêu cầu hỗ trợ không tồn tại!" });
            return;
        }

        ticket.status = status;
        await ticket.save();

        res.status(200).json({
            success: true,
            message: "Cập nhật trạng thái thành công!",
            data: {
                id: ticket._id,
                status: ticket.status,
                updatedAt: ticket.updatedAt
            }
        });

    } catch (error) {
        console.error("[Update Ticket Status Error]: ", error);
        res.status(500).json({ success: false, error: "Lỗi hệ thống khi cập nhật trạng thái!" });
    }
};
