import { Request, Response } from "express";
import User from "../modules/users.module";
import Post from "../modules/posts.module";


// [GET] /api/v1/users/:userId
export const profileById = async (req: Request, res: Response) => {
    try {
        const userId: string = req.params?.userId as string;
        if (!userId) {
            res.status(400).json({
                success: false,
                error: "Thiếu tham số userId trên URL!"
            });
            return;
        }

        const user = await User.findOne({_id: userId }).select("-password -isBanned -bannedReason -bannedUntil -resetPasswordToken -resetPasswordExpire -__v");
        if (!user) {
            res.status(404).json({
                success: false,
                error: "Người dùng này không tồn tại!"
            });
            return;
        }

        const postsCount = await Post.countDocuments({ author: userId });
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