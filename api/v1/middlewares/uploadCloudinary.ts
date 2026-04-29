import { Request, Response, NextFunction } from "express";
import { uploadBufferToCloudinary } from "../../../helpers/uploadToCloudinary";
import { AuthRequest } from "../../../helpers/extendRequest";

export const uploadCloud = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (req.file) {
            // Tải ảnh lên Cloudinary và lấy link về
            const link = await uploadBufferToCloudinary(req.file.buffer);
            
            // req.file.fieldname chính là tên field mà client gửi (vd: 'avatar', 'cover'...)
            // Cú pháp này sẽ tự động tạo req.body.avatar = link
            req.body[req.file.fieldname] = link;
        }
        
        // Cho phép request đi tiếp sang Controller
        next();
        
    } catch (error) {
        console.error("[Upload Middleware Error]:", error);
        
        // Nếu lỗi upload, chặn luôn không cho qua Controller nữa
        res.status(500).json({ 
            success: false, 
            error: "Lỗi hệ thống khi tải ảnh lên Cloudinary!" 
        });
    }
};