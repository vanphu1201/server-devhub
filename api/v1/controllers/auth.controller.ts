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

        // Kiểm tra đầu vào (Tránh lỗi vặt)
        if (!email || !password || !displayName) {
            res.status(400).json({
                success: false,
                error: "Vui lòng nhập đầy đủ email,  mật khẩu và display-name!"
            });
            return;
        }

        const [existEmail, existDisplayName] = await Promise.all([
            User.findOne({ email: email }),
            User.findOne({ displayName: displayName })
        ])

        // Kiểm tra mail có tồn tại chưa
        if (existEmail) {
            res.status(409).json({
                success: false,
                error: "Email đã tồn tại!"
            });
            return;
        }

        // Kiểm tra displayName có tồn tại chưa
        if (existDisplayName) {
            res.status(409).json({
                success: false,
                error: "Tên hiển thị đã bị trùng!"
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
            success: true,
            data: {        // Bọc vào 'data' để khớp với 'response.data?.token'
                id: newUser._id,
                email: newUser.email,
                displayName: newUser.displayName,
                token: token
            }
        });
    } catch (error) {
        console.log("[Aignup error:]", error);
        return res.status(500).json({
            success: false,
            error: "Lỗi hệ thống, vui lòng thử lại sau!"
        });
    }

}


// [POST] /api/v1/auth/login
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Kiểm tra đầu vào (Tránh lỗi vặt)
        if (!email || !password) {
            res.status(400).json({
                success: false,
                error: "Vui lòng nhập đầy đủ email và mật khẩu!"
            });
            return;
        }

        // Kiểm tra email có tồn tại
        const user = await User.findOne({email: email});
        if (!user) {
            res.status(401).json({
                success: false,
                error: "Email không tồn tại!"
            });
            return;
        }

        // Kiểm tra password có đúng
        const isPassword: boolean = await bcrypt.compare(password, user.password as string);
        if (!isPassword) {
            res.status(401).json({
                success: false,
                error: "Mật khẩu không chính xác!"
            });
            return;
        }

        // Kiểm tra tài khoản có bị khóa
        if (user.isBanned) {
            res.status(403).json({
                success: false,
                error: "Tài khoản đã bị khóa!"
            });
            return;
        }

        // Nếu thông qua hết các trường hợp thì tạo jwt mới cho user và trả token về cho client

        // Tạo mới JWT
        const payload = {
            id: user._id,
            displayName: user.displayName,
            role: user.role
        };
        const token = jwt.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRE
        });

        // Trả data cho client
        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                email: user.email,
                displayName: user.displayName,
                token: token
            }
        });

    } catch (error) {
        console.log("[Error login: ]", error);

        res.status(500).json({
            success: false,
            error: "Lỗi hệ thống, vui lòng thử lại sau!"
        });
    }
}