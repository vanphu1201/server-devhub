import { Request, Response, NextFunction } from "express";
import { uploadBufferToCloudinary } from "../../../helpers/uploadToCloudinary";
import { ExtendRequest } from "../../../helpers/extendRequest";

export const uploadCloud = async (req: ExtendRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        // TRƯỜNG HỢP 1: Tải lên NHIỀU ẢNH (upload.array) -> Dữ liệu nằm ở req.files
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            const files = req.files as any[];
            const fieldName = files[0].fieldname;
            
            const uploadPromises = files.map(file => uploadBufferToCloudinary(file.buffer));
            const links = await Promise.all(uploadPromises);
            
            req.body[fieldName] = links; 
        } 
        
        // TRƯỜNG HỢP 2: Tải lên 1 ẢNH (upload.single) -> Dữ liệu nằm ở req.file
        else if (req.file) {
            const link = await uploadBufferToCloudinary(req.file.buffer);
            req.body[req.file.fieldname] = link;
        }
        
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