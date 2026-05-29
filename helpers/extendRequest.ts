import { Request } from "express"
// Mở rộng interface Request của Express để TypeScript không báo lỗi khi  gán thêm thuộc tính
export interface ExtendRequest extends Request {
    user?: any,
    file?: any,
    files?: any
}