import { Request } from "express"
// Mở rộng interface Request của Express để TypeScript không báo lỗi khi  gán thêm thuộc tính
export interface AuthRequest extends Request {
    user?: any,
    file?: any
}