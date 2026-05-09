import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ExtendRequest } from "../../../helpers/extendRequest";

const JWT_SECRET = process.env.JWT_SECRET as string || "super_secret_for_devhub_120107";

export const requireAuth = (req: ExtendRequest, res: Response, next: NextFunction) => {
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


// Middleware Xác thực Tùy chọn (Cho phép cả Guest và User đã đăng nhập)
export const optionalAuth = (req: ExtendRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.header("Authorization");

        // Nếu KHÔNG CÓ header hoặc KHÔNG ĐÚNG chuẩn Bearer -> Coi như khách vãng lai, cho đi tiếp
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            next();
            return;
        }

        const token = authHeader.split(" ")[1];

        // Nếu có chữ Bearer nhưng lại không có token đằng sau -> Coi như khách, cho đi tiếp
        if (!token) {
            next();
            return;
        }

        // Giải mã token bằng đúng biến JWT_SECRET đã khai báo
        const decode = jwt.verify(token, JWT_SECRET);
        req.user = decode; // Gắn data vào req.user

        next();

    } catch (error) {
        // NẾU TOKEN LỖI HOẶC HẾT HẠN: Lờ đi, không gán req.user, cho đi tiếp như khách!
        next();
    }
}


export const requireAdmin = (req: ExtendRequest, res: Response, next: NextFunction): void => {    
    const userRole = req.user?.role;
    if (userRole !== "admin") {
        res.status(403).json({
            success: false,
            error: "Truy cập bị từ chối! Bạn không có quyền Admin."
        });
        return;
    }

    next();
}