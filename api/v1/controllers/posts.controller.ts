import { Request, Response } from "express";
import { ExtendRequest } from "../../../helpers/extendRequest";
import Post from "../modules/posts.module";
import mongoose from "mongoose";

// [POST] /posts/:postId/bookmark
export const bookmark = async (req: ExtendRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const postId = req.params?.postId;

        // Kiểm tra đăng nhập
        if (!userId) {
            res.status(401).json({
                success: false,
                error: "Vui lòng đăng nhập!"
            });
            return;
        }

        // Kiểm tra có truyền postId lên params không
        if (!postId) {
            res.status(400).json({
                success: false,
                error: "Vui lòng gửi kèm postId lên params!"
            });
            return;
        }

        // Kiểm tra postId có hợp lệ không
        if (!mongoose.isValidObjectId(postId)) {
            res.status(400).json({
                success: false,
                error: "postId gửi lên params không hợp lệ!"
            });
            return;
        }

        // Kiểm tra bài viết có tồn tại
        const post = await Post.findById(postId);
        if (!post) {
            res.status(404).json({
                success: false,
                error: "Bài viết không tồn tại!"
            });
            return;
        }

        // kiểm tra user đã bookmark chưa
        if (post.bookmarks.includes(userId)) {
            // Đã bookmark rồi thì không làm gì cả, trả về thành công luôn
            res.status(200).json({
                success: true,
                data: {
                    bookmarked: true,
                }
            });
            return;
        }

        // Nếu chưa bookmark thì phải thêm và cộng vào
        await Post.findByIdAndUpdate(
            postId,
            {
                $push: { bookmarks: userId },
                $inc: { bookmarksCount: 1 }
            }
        );

        res.status(200).json({
            success: true,
            data: {
                bookmarked: true
            }
        });
        return;

    } catch (error) {
        console.log("[Bookmark Error: ]", error);
        res.status(500).json({
            success: false,
            error: "Lỗi hệ thống, vui lòng thử lại sau!"
        });
        return;
    }

}

// [DELETE] /posts/:postId/bookmark
export const unBookmark = async (req: ExtendRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const postId = req.params?.postId;

        // Kiểm tra đăng nhập
        if (!userId) {
            res.status(401).json({
                success: false,
                error: "Vui lòng đăng nhập!"
            });
            return;
        }

        // Kiểm tra có truyền postId lên params không
        if (!postId) {
            res.status(400).json({
                success: false,
                error: "Vui lòng gửi kèm postId lên params!"
            });
            return;
        }

        // Kiểm tra postId có hợp lệ không
        if (!mongoose.isValidObjectId(postId)) {
            res.status(400).json({
                success: false,
                error: "postId gửi lên params không hợp lệ!"
            });
            return;
        }

        // Kiểm tra bài viết có tồn tại
        const post = await Post.findById(postId);
        if (!post) {
            res.status(404).json({
                success: false,
                error: "Bài viết không tồn tại!"
            });
            return;
        }

        // kiểm tra user đã bookmark chưa
        if (!post.bookmarks.includes(userId)) {
            // Nếu chưa bookmark thì không làm gì cả, trả về thành công luôn
            res.status(200).json({
                success: true,
                data: {
                    bookmarked: false,
                }
            });
            return;
        }

        // Nếu đã bookmark rồi thì phải bỏ và trừ ra
        await Post.findByIdAndUpdate(
            postId,
            {
                $pull: { bookmarks: userId },
                $inc: { bookmarksCount: -1 }
            }
        );

        res.status(200).json({
            success: true,
            data: {
                bookmarked: false
            }
        });
        return;

    } catch (error) {
        console.log("[UnBookmark Error: ]", error);
        res.status(500).json({
            success: false,
            error: "Lỗi hệ thống, vui lòng thử lại sau!"
        });
        return;
    }

}

// [GET] /posts/:postId/is-bookmarked
export const isBookmarked = async (req: ExtendRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const postId = req.params?.postId;

        // Kiểm tra có đăng nhập chưa
        if (!userId) {
            res.status(401).json({
                success: false,
                error: "Vui lòng đăng nhập"
            });
            return;
        }

        // Kiểm tra có truyền postId lên params không
        if (!postId) {
            res.status(400).json({
                success: false,
                error: "Chưa truyền postId lên params!"
            });
            return;
        }

        // Kiểm tra postId có hợp lệ không
        if (!mongoose.isValidObjectId(postId)) {
            res.status(404).json({
                success: false,
                error: "postId gửi lên không hợp lệ!"
            });
            return;
        }

        // Kiểm tra xem có bookmarked chưa
        const checkBookmark = await Post.exists({
            _id: postId,
            bookmarks: userId
        });
        res.status(200).json({
            success: true,
            data: {isBookmarked: !!checkBookmark}
        });

    } catch (error) {
        console.log("[IsBookmarked Error: ]", error);
        res.status(500).json({
            success: false,
            error: "Lỗi hệ thống, vui lòng thử lại sau!"
        });
        return;
    }
}