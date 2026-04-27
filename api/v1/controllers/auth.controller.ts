import { Request, Response } from "express";
import User from "../modules/users.module";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import nodemailer from "nodemailer";

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
        const user = await User.findOne({ email: email });
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


// [POST] /api/v1/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const email: string = req.body.email;
        // Kiểm tra client có gửi lên email hay không
        if (!email) {
            res.status(400).json({
                success: false,
                error: "Vui lòng cung cấp đầy đủ email!"
            });
            return;
        }

        // Kiểm tra email có tồn tại không
        const user = await User.findOne({ email: email });
        if (!user) {
            // Dù không tồn tại vẫn gửi 200 để phòng hacker
            res.status(200).json({
                success: true,
                data: {
                    message: "Nếu email tồn tại, link khôi phục đã được gửi!"
                }
            });
            return;
        }

        // Tạo và lưu resetToken và expireToken vào database
        const resetToken = crypto.randomBytes(20).toString("hex");
        const expireToken = new Date(Date.now() + 60 * 1000);
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = expireToken;
        await user.save();

        console.log("Email:", process.env.EMAIL_USER);
        console.log("Pass:", process.env.EMAIL_PASSWORD);

        // gửi link qua mail cho client
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
        const htmlTemplate = `
        <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
            <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0;">
                <h2 style="color: #2c3e50; margin: 0;">DevHub System</h2>
            </div>
            
            <div style="padding: 20px 0;">
                <p style="font-size: 16px; color: #333333; line-height: 1.5;">Chào bạn,</p>
                <p style="font-size: 16px; color: #333333; line-height: 1.5;">Hệ thống nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn tại <strong>DevHub</strong>. Vui lòng nhấn vào nút bên dưới để tiến hành đặt lại mật khẩu mới:</p>
                
                <div style="text-align: center; margin: 35px 0;">
                    <a href="${resetUrl}" style="background-color: #3b82f6; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
                        ĐẶT LẠI MẬT KHẨU
                    </a>
                </div>
                
                <p style="font-size: 14px; color: #e74c3c;"><strong>Lưu ý:</strong> Link này sẽ tự động hết hạn sau <strong>1 phút</strong> vì lý do bảo mật.</p>
                <p style="font-size: 14px; color: #7f8c8d; line-height: 1.5;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này. Mật khẩu của bạn vẫn an toàn.</p>
            </div>
            
            <div style="text-align: center; padding-top: 20px; border-top: 1px solid #f0f0f0;">
                <p style="font-size: 12px; color: #95a5a6;">© 2024 DevHub. All rights reserved.</p>
                <p style="font-size: 12px; color: #95a5a6;">Đây là email tự động, vui lòng không trả lời.</p>
            </div>
        </div>
        `;


        // Thay localhost:3000 khi đã deploy frontend
        const mailOptions = {
            from: `"Sender Name" ${process.env.EMAIL_USER}`,
            to: email,
            subject: "Khôi phục mật khẩu tài khoản DevHub",
            html: htmlTemplate
        };

        // Gửi mail
        await transporter.sendMail(mailOptions);
        console.log(`[Email Sent] Đã gửi link reset đến: ${email}`);

        // trả data cho client
        res.status(200).json({
            success: true,
            data: { message: "Email reset password đã được gửi!" }
        })

    } catch (error) {
        console.log("[Error Forgot password: ]", error);
        res.status(500).json({
            success: false,
            error: "lỗi hệ thống, vui lòng thử lại sau!"
        });
        return;
    }
}

// [POST] /api/v1/auth/reset-password
export const resetPassword = async (req: Request, res: Response) => {
    try {
        // Kiểm tra có đủ token với newPassword hay không
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            res.status(400).json({
                success: false,
                error: "Thiếu token hoặc mật khẩu mới!"
            });
            return;
        }

        // Kiểm tra token có hợp lệ hoặc quá hạn không
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            res.status(400).json({
                success: false,
                error: "Token không hợp lệ hoặc hết hạn!"
            });
            return;
        }

        // mã hóa newPassword
        const saltRounds = 10;
        user.password = await bcrypt.hash(newPassword, saltRounds);

        // Xóa token và hạn của token
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        // Lưu vào database
        await user.save();

        // Trả data về cho client
        res.status(200).json({
            success: true,
            data: {
                message: "reset password thành công!"
            }
        });
        return;
    } catch (error) {
        console.log("[Reset password Error: ]", error);
        res.status(500).json({
            success: false,
            error: "Lỗi hệ thống, vui lòng thử lại sau!"
        });
        return;
    }
}