import { Request, Response } from "express";
import { ExtendRequest } from "../../../helpers/extendRequest";
import Post from "../modules/posts.module";
import mongoose from "mongoose";
import Comment from "../modules/comments.module";
import User from "../modules/users.module";

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
            data: { isBookmarked: !!checkBookmark }
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

// [GET] /posts/:postId/comments
export const getComments = async (req: Request, res: Response) => {
    try {
        const limit: number = parseInt(req.query?.limit as string) || 20;
        const offset: number = parseInt(req.query?.offset as string) || 0;

        // Kiểm tra xem có truyền lên postId không
        const postId = req.params.postId;
        if (!postId) {
            res.status(400).json({
                success: false,
                error: "Vui lòng truyền postId lên params!"
            });
            return;
        }

        // Kiểm tra postId có hợp lệ không
        if (!mongoose.isValidObjectId(postId)) {
            res.status(400).json({
                success: false,
                error: "postId không hợp lệ!"
            });
            return;
        }

        // Kiểm tra postId có tồn tại không
        const post = await Post.exists({ _id: postId });
        if (!post) {
            res.status(404).json({
                success: false,
                error: "Post không tồn tại!"
            });
            return;
        }

        // Lấy comments và tổng comment
        const [totalComments, comments] = await Promise.all([
            Comment.countDocuments({ targetId: postId, targetType: "post" }),

            // 2. Lấy danh sách comment theo Phân trang
            Comment.find({ targetId: postId, targetType: "post" })
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit)
                .select("_id content author likes createdAt")
                .populate({
                    path: "author",
                    select: "-password"
                })
                .lean()
        ]);

        // Nếu không có comment nào, trả về rỗng
        if (totalComments === 0) {
            res.status(200).json({
                success: true,
                data: { comments: [], total: 0 }
            });
            return;
        }

        const dataCommentValidated = comments.map((comment, _) => ({
            id: comment._id,
            content: comment.content,
            author: comment.author,
            likes: comment.likes?.length || 0,
            createdAt: comment.createdAt
        }))

        // Trả data về cho client
        res.status(200).json({
            success: true,
            data: {
                comments: dataCommentValidated,
                total: totalComments
            }
        });
        return;

    } catch (error) {
        console.log("[Get comments Error: ]", error);
        res.status(500).json({
            success: false,
            error: "Lỗi hệ thống, vui lòng thử lại sau!"
        });
        return;
    }
}

// [POST] /posts/:postId/comments
export const postComments = async (req: ExtendRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const postId = req.params?.postId;
        const { content, images } = req.body;

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
        const post = await Post.exists({_id: postId});
        if (!post) {
            res.status(404).json({
                success: false,
                error: "Bài viết không tồn tại!"
            });
            return;
        }

        const safeImages = Array.isArray(images) ? images : []; 
        // Phải có ít nhất nội dung chữ HOẶC có ít nhất 1 ảnh
        if (!content && safeImages.length === 0) {
            res.status(400).json({
                success: false,
                error: "Vui lòng nhập nội dung hoặc đính kèm hình ảnh bình luận!"
            });
            return;
        }

        // Tạo comment mới
        const newComment = new Comment({
            author: userId,
            targetType: "post",
            targetId: postId,
            content: content,
            images: safeImages,
            likes: []
        });

        const [savedComment, user] = await Promise.all([
            newComment.save(),
            User.findById(userId).select("-password").lean()
        ]);

        // Trả data cho client
        res.status(200).json({
            success: true,
            data: {
                id: savedComment._id,
                content: savedComment.content,
                author: user,
                createdAt: savedComment.createdAt
            }
        });
        return;

    } catch (error) {
        console.log("[Post comment Error: ]", error);
        res.status(500).json({
            success: false,
            error: "Lỗi hệ thống, vui lòng thử lại sau!"
        });
        return;
    }
}