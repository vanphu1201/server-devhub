import { Request, Response, NextFunction } from "express";
import { uploadBufferToCloudinary } from "../../../helpers/uploadToCloudinary";
import { ExtendRequest } from "../../../helpers/extendRequest";

export const uploadCloud = async (req: ExtendRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({
                success: false,
                error: "Vui lòng chọn ảnh!"
            });
            return;
        }
        // Tải ảnh lên Cloudinary và lấy link về
        const link = await uploadBufferToCloudinary(req.file.buffer);
        req.body[req.file.fieldname] = link;

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