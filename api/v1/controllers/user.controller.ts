import { Request, Response } from "express";
import User from "../modules/users.module";
import Post from "../modules/posts.module";
import mongoose from "mongoose";
import { ExtendRequest } from "../../../helpers/extendRequest";

// [GET] /api/v1/users/:identifier
export const identifier = async (req: Request, res: Response) => {
    try {
        const identifier: string = req.params.identifier as string;

        if (!identifier) {
            res.status(400).json({
                success: false,
                error: "Thiếu tham số định danh trên URL!"
            });
            return;
        }

        // Gán đúng giá trị cho param clien đưa lên
        const query = mongoose.isValidObjectId(identifier)
            ? { $or: [{ _id: identifier }, { username: identifier }] }
            : { username: identifier };

        const user = await User.findOne(query)
            .select("-password -isBanned -bannedReason -bannedUntil -resetPasswordToken -resetPasswordExpire -__v");

        if (!user) {
            res.status(404).json({
                success: false,
                error: "Người dùng này không tồn tại!"
            });
            return;
        }

        const postsCount = await Post.countDocuments({ author: user.id });
        //const productsCount = await Product.countDocuments({ author: userId });
        const userObj = user.toObject();
        res.status(200).json({
            success: true,
            data: {
                id: userObj._id,
                email: userObj.email,
                displayName: userObj.displayName,
                username: userObj.username,
                avatar: userObj.avatar,
                cover: userObj.cover,
                bio: userObj.bio,
                skills: userObj.skills,
                reputation: userObj.reputation,
                followers: userObj.followers?.length || 0,
                following: userObj.following?.length || 0,
                postsCount: postsCount || 0,
                //productsCount: userObj.productsCount || 0,
                joinedDate: userObj.createdAt
            }
        });
        return;
    } catch (error) {
        console.log("[Get Profile User Error: ]", error);
        res.status(500).json({
            success: false,
            error: "LỖi hệ thống, vui lòng thử lại sau!"
        });
        return;
    }
}


// [PUT] /api/v1/users/profile
export const profile = async (req: ExtendRequest, res: Response) => {
    try {
        // Kiểm tra có vượt qua requireAuth middleware chưa
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: "Không tìm thấy thông tin xác thực, vui lòng đăng nhập lại!"
            });
            return;
        }

        // Lấy dữ liệu từ client để upd
        const { displayName, avatar, cover, bio, skills } = req.body;
        const updateData = { displayName, avatar, cover, bio, skills };

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            {
                new: true, // Bắt Mongoose trả về data MỚI sau khi update
                runValidators: true // Ép Mongoose chạy lại các kiểm tra (như enum, required...) trong Schema
            }
        ).select("-password -isBanned -bannedReason -bannedUntil -resetPasswordToken -resetPasswordExpire -__v");

        if (!updatedUser) {
            res.status(404).json({
                success: false,
                error: "Không tìm thấy người dùng!"
            });
            return;
        }

        // Trả data về cho client
        res.status(200).json({
            success: true,
            data: {
                message: "Cập nhập Profile thành công!",
                user: updatedUser
            }
        })
    } catch (error) {
        console.log("[Update Profile Error: ]", error);
        res.status(500).json({
            success: false,
            error: "Lỗi hệ thống, vui lòng thử lại sau!"
        });
        return;
    }
}

// [POST] /api/v1/users/avatar
export const avatar = async (req: ExtendRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const avatarUrl: string = req.body.avatar as string;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: "Vui lòng đăng nhập!"
            });
            return;
        }
        // Lưu link vào Database
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { avatar: avatarUrl },
            { new: true }
        ).select("-password -__v");

        res.status(200).json({
            success: true,
            data: {
                message: "Cập nhật ảnh đại diện thành công!",
                url: avatarUrl,
                user: updatedUser
            }
        });

    } catch (error) {
        console.error("[Upload Avatar Error:]", error);
        res.status(500).json({
            success: false,
            error: "Lỗi hệ thống khi tải ảnh lên!"
        });
        return;
    }
}

// [POST] /api/v1/users/cover
export const cover = async (req: ExtendRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const coverUrl: string = req.body.cover as string;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: "Vui lòng đăng nhập!"
            });
            return;
        }
        // Lưu link vào Database
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { cover: coverUrl },
            { new: true }
        ).select("-password -__v");

        res.status(200).json({
            success: true,
            data: {
                message: "Cập nhật ảnh bìa thành công!",
                url: coverUrl,
                user: updatedUser
            }
        });

    } catch (error) {
        console.error("[Upload Cover Error:]", error);
        res.status(500).json({
            success: false,
            error: "Lỗi hệ thống khi tải ảnh lên!"
        });
        return;
    }
}

// [POST] /api/v1/users/:userId/follow
export const follow = async (req: ExtendRequest, res: Response) => {
    try {
        const myUserId = req.user?.id;
        const userId = req.params?.userId;
        // Kiểm tra có vượt qua middleware chưa
        if (!myUserId) {
            res.status(401).json({
                success: false,
                error: "Bạn chưa đăng nhập!"
            });
            return;
        }
        // Kieemrr tra client có gửi userId lên param chưa
        if (!userId) {
            res.status(400).json({
                success: false,
                error: "Chưa chuyền userId lên params!"
            });
            return;
        }

        // Chặn lỗi do truyền id không hợp lệ
        if (!mongoose.isValidObjectId(userId)) {
            res.status(400).json({ success: false, error: "ID người dùng không hợp lệ!" });
            return;
        }

        // Kiêm tra userId truyền lên có hợp lệ không
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                error: "User id gửi lên không hợp lệ!"
            });
            return;
        }

        // Chặn lỗi tự follow bản thân
        if (myUserId.toString() === userId.toString()) {
            res.status(400).json({ success: false, error: "Bạn không thể tự theo dõi chính mình!" });
            return;
        }

        await Promise.all([
            User.findByIdAndUpdate(myUserId, {
                $addToSet: { following: userId }
            }),

            User.findByIdAndUpdate(userId, {
                $addToSet: { followers: myUserId }
            })
        ]);

        // Trả data về cho client
        res.status(200).json({
            success: true,
            data: {
                "message": "User followed",
                "isFollowing": true
            }
        });
        return;


    } catch (error) {
        console.log("[Following Error: ]", error);
        res.status(500).json({
            success: false,
            error: "Lỗi hệ thống, vui lòng thử lại sau!"
        });
        return;
    }
}

// [DELETE] /api/v1/users/:userId/follow
export const unFollow = async (req: ExtendRequest, res: Response) => {
    try {
        const myUserId = req.user?.id;
        const userId = req.params?.userId;
        // Kiểm tra có vượt qua middleware chưa
        if (!myUserId) {
            res.status(401).json({
                success: false,
                error: "Bạn chưa đăng nhập!"
            });
            return;
        }
        // Kieemrr tra client có gửi userId lên param chưa
        if (!userId) {
            res.status(400).json({
                success: false,
                error: "Chưa chuyền userId lên params!"
            });
            return;
        }

        // Chặn lỗi do truyền id không hợp lệ
        if (!mongoose.isValidObjectId(userId)) {
            res.status(400).json({ success: false, error: "ID người dùng không hợp lệ!" });
            return;
        }

        // Kiêm tra userId truyền lên có hợp lệ không
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                error: "User id gửi lên không hợp lệ!"
            });
            return;
        }

        // Chặn lỗi tự unfollow bản thân
        if (myUserId.toString() === userId.toString()) {
            res.status(400).json({ success: false, error: "Bạn không thể tự hủy theo dõi chính mình!" });
            return;
        }

        await Promise.all([
            User.findByIdAndUpdate(myUserId, {
                $pull: { following: userId }
            }),

            User.findByIdAndUpdate(userId, {
                $pull: { followers: myUserId }
            })
        ]);

        // Trả data về cho client
        res.status(200).json({
            success: true,
            data: {
                "message": "User unfollowed",
                "isFollowing": false
            }
        });
        return;


    } catch (error) {
        console.log("[UnFollowing Error: ]", error);
        res.status(500).json({
            success: false,
            error: "Lỗi hệ thống, vui lòng thử lại sau!"
        });
        return;
    }
}

// [GET] /api/v1/users/:userId/is-following
export const isFollowing = async (req: ExtendRequest, res: Response) => {
    try {
        const myUserId = req.user?.id;
        const userId = req.params?.userId;

        // Kiểm tra đăng nhập
        if (!myUserId) {
            res.status(401).json({ 
            success: false,
            error: "Vui lòng đăng nhập!"
        });
            return;
        }

        // Kiểm tra tham số truyền lên
        if (!userId) {
            res.status(400).json({
                success: false,
                error: "Chưa truyền tham số userId lên URL!"
            });
            return;
        }

        // Chặn lỗi CastError 
        if (!mongoose.isValidObjectId(userId)) {
            res.status(400).json({
                success: false,
                error: "ID người dùng không hợp lệ!"
            });
            return;
        }

        // Xử lý trường hợp tự check chính mình (Vô lý -> Trả về false luôn cho nhanh)
        if (myUserId.toString() === userId.toString()) {
            res.status(200).json({
                isFollowing: false
            });
            return;
        }

        // Tìm xem có User nào là "MÌNH" VÀ có chứa "ID NGƯỜI KIA" trong mảng following không
        const checkFollow = await User.exists({
            _id: myUserId,
            following: userId
        });

        // Trả kết quả (Ép kiểu checkFollow về dạng Boolean true/false)
        res.status(200).json({
            isFollowing: !!checkFollow
        });

    } catch (error) {
        console.error("[Check Following Error:]", error);
        res.status(500).json({
            success: false,
            error: "Lỗi hệ thống, vui lòng thử lại sau!"
        });
    }
}
