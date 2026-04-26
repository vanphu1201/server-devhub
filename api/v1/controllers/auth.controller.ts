import { Request, Response } from "express";
import User from "../modules/users.module";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string || "super_secret_for_devhub_120107";
const JWT_EXPIRE = process.env.JWT_EXPIRE as any || "7d";

// [POST] /api/v1/auth/signup
export const signup = async (req: Request, res: Response) => {
    try {
        const email: string = req.body.email;
        const password: string = req.body.password;
        const displayName: string = req.body.displayName;

        const [existEmail, existDisplayName] = await Promise.all([
            User.findOne({ email: email }),
            User.findOne({ displayName: displayName })
        ])

        // Kiểm tra mail có tồn tại chưa
        if (existEmail) {
            res.status(409).json({
                code: 409,
                message: "Email đã tồn tại!"
            });
            return;
        }

        // Kiểm tra displayName có tồn tại chưa
        if (existDisplayName) {
            res.status(409).json({
                code: 409,
                message: "Tên hiển thị đã bị trùng!"
            });
            return;
        }

        // Mã hóa passwork
        const saltRounds: number = 10;
        const hashedPassword: string = await bcrypt.hash(password, saltRounds);

        // Lưu user mới
        const newUser = new User({
            email: email,
            password: hashedPassword,
            displayName: displayName
        });
        await newUser.save();

        // Tạo JWT
        const payload = {
            id: newUser._id,
            displayName: newUser.displayName,
            role: newUser.role
        }
        const token = jwt.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRE
        });

        // Gửi data cho Frontend
        res.status(201).json({
            code: 201,
            message: "Đăng ký thành công",
            id: newUser._id,
            email: newUser.email,
            displayName: newUser.displayName,
            token: token
        });
    } catch (error) {
        console.log("[Aignup error:]", error);
        return res.status(500).json({
            code: 500,
            message: "Lỗi hệ thống, vui lòng thử lại sau!"
        });
    }

}