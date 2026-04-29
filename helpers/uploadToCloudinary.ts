import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import streamifier from 'streamifier';

console.log(process.env.API_KEY);
console.log(process.env.CLOUD_NAME);


// Cấu hình Cloudinary (Đảm bảo bạn đã khai báo biến môi trường trong file .env)
cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET 
});

// Hàm hỗ trợ: Biến stream upload thành một Promise để dùng được async/await
const streamUpload = (buffer: Buffer): Promise<UploadApiResponse> => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
                if (result) {
                    resolve(result);
                } else {
                    reject(error);
                }
            }
        );

        // Đọc buffer và bơm (pipe) thẳng vào luồng upload của Cloudinary
        streamifier.createReadStream(buffer).pipe(stream);
    });
};

// Export hàm chính để sử dụng ở Controller
export const uploadBufferToCloudinary = async (buffer: Buffer): Promise<string> => {
    try {
        const result = await streamUpload(buffer);
        return result.secure_url; // Trả về link ảnh bảo mật (https)
    } catch (error) {
        console.error("[Cloudinary Upload Error]:", error);
        throw new Error("Lỗi tải ảnh lên Cloudinary!");
    }
};