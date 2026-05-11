import { Request, Response } from "express";
import User from "../models/users.model";


// [GET] /api/v1/leaderboard?limit=50&offset=0
export const getLeaderboard = async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        // Bảo mật: Chặn client yêu cầu quá nhiều data cùng lúc gây sập server
        const safeLimit = limit > 100 ? 100 : limit;

        // Truy vấn Database
        const topUsers = await User.find({ isBanned: { $ne: true } })
            .sort({ reputation: -1 })
            .skip(offset)
            .limit(safeLimit)
            .select("_id displayName reputation avatar")
            .lean();

        // Format lại dữ liệu và tính toán rank
        const leaderboard = topUsers.map((user, index) => ({
            id: user._id,
            displayName: user.displayName,
            reputation: user.reputation,
            avatar: user.avatar,
            rank: offset + index + 1
        }));

        // Trả data về cho client
        res.status(200).json({
            users: leaderboard
        });

    } catch (error) {
        console.error("[Get Leaderboard Error:]", error);
        res.status(500).json({
            success: false,
            error: "Lỗi hệ thống khi tải bảng xếp hạng!"
        });
    }
};