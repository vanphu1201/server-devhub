import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string || "super_secret_for_devhub_120107";

// Mở rộng interface Request của Express để TypeScript không báo lỗi khi  gán thêm thuộc tính req.user
export interface AuthRequest extends Request {
    user?: any
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.header("Authorization");

        // Kiểm tra Header có đúng chuẩn Bearer <token> không
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                success: false,
                error: "Vui lòng đăng nhập!"
            });
            return;
        }

        // Kiểm tra có token có hợp lệ không
        const token = authHeader.split(" ")[1];
        if (!token) {
            res.status(401).json({
                success: false,
                error: "Token không hợp lệ!"
            });
            return;
        }

        // Giải mã token (nếu mã lỗi, lỗi sẽ nhảy xuống catch)
        const decode = jwt.verify(token, JWT_SECRET);
        req.user = decode;

        next();

    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({
                success: false,
                error: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!"
            });
            return;
        }

        res.status(401).json({
            success: false,
            error: "Token xác thực không hợp lệ!"
        });
        return;
    }
}