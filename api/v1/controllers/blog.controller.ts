import { Request, Response } from "express";
import { ExtendRequest } from "../../../helpers/extendRequest";
import BlogPost from "../modules/blog_posts.module";
import mongoose from "mongoose";

// [GET] /api/v1/blog/posts?category=tech&sortBy=latest&limit=20&offset=0&search=keyword
export const getPosts = async (req: ExtendRequest, res: Response) => {
    try {
        // Lấy thông tin User (Nếu có đăng nhập thì lấy ID để check isLiked, không thì thôi)
        const userId = req.user?.id;

        // Lấy Params từ Query String
        const category = req.query.category as string;
        const search = req.query.search as string;
        const sortBy = req.query.sortBy as string || 'latest';

        // Phân trang
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;

        // XÂY DỰNG BỘ LỌC
        // Mặc định chỉ lấy bài viết đã được duyệt
        const query: any = { status: "approved" };

        if (category) {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { content: { $regex: search, $options: "i" } },
                { tags: { $regex: search, $options: "i" } }
            ];
        }

        // XÂY DỰNG BỘ SẮP XẾP
        let sortObj: any = { createdAt: -1 }; // Mặc định là 'latest'

        if (sortBy === 'trending') {
            sortObj = { views: -1, createdAt: -1 };
        } else if (sortBy === 'mostLiked') {
            sortObj = { views: -1 };
        }

        const [posts, total] = await Promise.all([
            BlogPost.find(query)
                .sort(sortObj)
                .skip(offset)
                .limit(limit)
                .populate("author", "-password")
                .lean(),
            BlogPost.countDocuments(query)
        ]);

        // Format lại data cho đúng định dạng trả về
        const formattedPosts = posts.map(post => {
            const likesArray = Array.isArray(post.likes) ? post.likes : [];
            const bookmarksArray = Array.isArray(post.bookmarks) ? post.bookmarks : [];
            const commentsArray = Array.isArray(post.comments) ? post.comments : [];

            // Kiểm tra xem user hiện tại đã like/bookmark chưa
            const isLiked = userId ? likesArray.some(id => id.toString() === userId.toString()) : false;
            const isBookmarked = userId ? bookmarksArray.some(id => id.toString() === userId.toString()) : false;

            return {
                id: post._id,
                title: post.title,
                slug: post.slug,
                content: post.content,
                excerpt: post.excerpt,
                author: post.author,
                category: post.category,
                tags: post.tags,
                status: post.status,
                image: post.images,
                readTime: post.readTime,
                views: post.views,
                likes: likesArray.length,
                commentsCount: commentsArray.length,
                isLiked: isLiked,
                isBookmarked: isBookmarked,
                createdAt: post.createdAt
            };
        });

        // Trả data cho client
        res.status(200).json({
            success: true,
            data: {
                posts: formattedPosts,
                total: total
            }
        });

    } catch (error) {
        console.error("[Get Blog Posts Error]: ", error);
        res.status(500).json({
            success: false,
            error: "Lỗi hệ thống khi lấy danh sách bài viết!"
        });
        return;
    }
}

// [GET] /api/v1/blog/posts/:idOrSlug
export const getPost = async (req: ExtendRequest, res: Response) => {
    try {
        const { idOrSlug } = req.params;

        // Kiểm tra tham số đầu vào
        if (!idOrSlug) {
            res.status(400).json({
                success: false,
                error: "Vui lòng truyền ID hoặc Slug của bài viết!"
            });
            return;
        }

        // Phân loại truy vấn: ID hay Slug?
        let query: any = {};
        if (mongoose.isValidObjectId(idOrSlug)) {
            // Nếu là ID hợp lệ -> Tìm xem khớp _id HOẶC khớp slug
            query = { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] };
        } else {
            // Nếu không phải chuẩn ID -> Chắc chắn là slug
            query = { slug: idOrSlug };
        }

        // Vừa tìm bài viết, vừa tăng lượt xem lên 1
        const post = await BlogPost.findOneAndUpdate(
            query,
            { $inc: { views: 1 } },
            { new: true }
        )
            .populate("author", "-password")
            .lean();

        // Báo lỗi nếu không tìm thấy
        if (!post) {
            res.status(404).json({
                success: false,
                error: "Bài viết không tồn tại!"
            });
            return;
        }

        // BẢO MẬT: Kiểm tra trạng thái bài viết
        // Nếu bài viết không ở trạng thái "approved" (ví dụ: bản nháp), chỉ tác giả mới được xem
        if (post.status !== "approved") {
            const userId = req.user?.id;
            if (!userId || post.author?._id?.toString() !== userId.toString()) {
                res.status(403).json({
                    success: false,
                    error: "Bài viết này chưa được công khai hoặc đang là bản nháp!"
                });
                return;
            }
        }

        // Format lại chuẩn JSON trả về như frontend yêu cầu
        res.status(200).json({
            success: true,
            data: {
                id: post._id,
                title: post.title,
                slug: post.slug,
                content: post.content,
                author: post.author,
                category: post.category,
                tags: post.tags,
                image: post.images,
                readTime: post.readTime,
                views: post.views,
                likes: Array.isArray(post.likes) ? post.likes.length : 0,
            }
        });

    } catch (error) {
        console.error("[Get Single Blog Post Error]: ", error);
        res.status(500).json({
            success: false,
            error: "Lỗi hệ thống khi lấy chi tiết bài viết!"
        });
    }
}

// [GET] /api/v1/blog/admin/posts?status=draft&limit=20&offset=0
// (status: draft, pending, approved, rejected)
export const getAllPosts = async (req: ExtendRequest, res: Response) => {
    try {
        // Lấy Params từ Query String
        const status = req.query.status as string;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;

        // Khởi tạo bộ lọc (Query)
        const query: any = {};

        // Nếu admin có truyền status
        if (status) {
            // Kiểm tra xem status truyền lên có hợp lệ không
            const validStatuses = ["draft", "pending", "approved", "rejected"];
            if (validStatuses.includes(status)) {
                query.status = status;
            }
        }

        // Truy vấn song song (Vừa lấy data, vừa đếm tổng số lượng)
        const [posts, total] = await Promise.all([
            BlogPost.find(query)
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit)
                .populate("author", "-password")
                .lean(),
            BlogPost.countDocuments(query)
        ]);

        // Format lại data (Admin thường cần xem các thông số thô nên không cần ẩn nhiều)
        const formattedPosts = posts.map(post => ({
            id: post._id,
            title: post.title,
            slug: post.slug,
            author: post.author,
            category: post.category,
            status: post.status,
            views: post.views,
            likesCount: Array.isArray(post.likes) ? post.likes.length : 0,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt
        }));

        // Trả kết quả
        res.status(200).json({
            success: true,
            data: {
                posts: formattedPosts,
                total: total
            }
        });

    } catch (error) {
        console.error("[Get Admin Posts Error]: ", error);
        res.status(500).json({
            success: false,
            error: "Lỗi hệ thống khi lấy danh sách bài viết kiểm duyệt!"
        });
    }
}

// [POST] /api/v1/blog/posts
export const postBlogPost = async (req: ExtendRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        // Kiểm tra đăng nhập kép (Bảo vệ thêm 1 lớp dù đã có middleware)
        if (!userId) {
            res.status(401).json({
                success: false,
                error: "Vui lòng đăng nhập để tạo bài viết!"
            });
            return;
        }

        // Trích xuất dữ liệu từ Request Body
        const { title, content, excerpt, category, tags, images } = req.body;

        // Validate (Kiểm tra) dữ liệu bắt buộc
        if (!title || !content) {
            res.status(400).json({
                success: false,
                error: "Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết!"
            });
            return;
        }

        // Khởi tạo bản ghi mới
        const newPost = new BlogPost({
            title: title.trim(),
            content: content,
            excerpt: excerpt || "",
            category: category || "",
            tags: Array.isArray(tags) ? tags : [],
            images: images || "",
            author: userId
        });

        // Lưu xuống Database
        await newPost.save();

        // Trả về kết quả cho Client
        res.status(201).json({
            success: true,
            data: {
                id: newPost._id,
                title: newPost.title,
                slug: newPost.slug,
                status: newPost.status,
                createdAt: newPost.createdAt
            }
        });

    } catch (error) {
        console.error("[Create Blog Post Error]: ", error);
        res.status(500).json({
            success: false,
            error: "Lỗi hệ thống khi tạo bài viết mới!"
        });
    }
}

// [PUT] /api/v1/blog/posts/:postId
export const putBlogPost = async (req: ExtendRequest, res: Response) => {
    try {
        const { postId } = req.params;
        const userId = req.user?.id;

        // Kiểm tra ID bài viết có chuẩn không
        if (!mongoose.isValidObjectId(postId)) {
            res.status(400).json({
                success: false,
                error: "ID bài viết không hợp lệ!"
            });
            return;
        }

        // Tìm bài viết trong Database
        const post = await BlogPost.findById(postId);
        if (!post) {
            res.status(404).json({
                success: false,
                error: "Không tìm thấy bài viết!"
            });
            return;
        }

        // BẢO MẬT: Kiểm tra quyền tác giả (Chỉ tác giả mới được sửa)
        if (post.author.toString() !== userId.toString()) {
            res.status(403).json({
                success: false,
                error: "Bạn không có quyền chỉnh sửa bài viết này!"
            });
            return;
        }

        const { title, content, excerpt, category, tags, images } = req.body;

        if (title) post.title = title.trim();
        if (content) post.content = content;
        if (excerpt !== undefined) post.excerpt = excerpt;
        if (category !== undefined) post.category = category;
        if (tags && Array.isArray(tags)) post.tags = tags;
        if (images !== undefined) post.images = images;

        // Lưu lại xuống Database
        await post.save();

        // Trả về kết quả thành công
        res.status(200).json({
            success: true,
            message: "Cập nhật bài viết thành công!",
            data: {
                post: {
                    id: post._id,
                    title: post.title,
                    slug: post.slug,
                    content: post.content,
                    category: post.category,
                    tags: post.tags,
                    images: post.images,
                    status: post.status,
                    updatedAt: post.updatedAt
                }
            }
        });

    } catch (error) {
        console.error("[Update Blog Post Error]: ", error);
        res.status(500).json({
            success: false,
            error: "Lỗi hệ thống khi cập nhật bài viết!"
        });
    }
}

// [DELETE] /api/v1/blog/posts/:postId
export const deleteBlogPost = async (req: ExtendRequest, res: Response) => {
    try {
        const { postId } = req.params;
        const userId = req.user?.id; // Lấy ID của user đang yêu cầu xóa từ token

        // Kiểm tra ID bài viết có hợp lệ không
        if (!mongoose.isValidObjectId(postId)) {
            res.status(400).json({
                success: false,
                error: "ID bài viết không hợp lệ!"
            });
            return;
        }

        // Tìm bài viết trong Database
        const post = await BlogPost.findById(postId);

        // Nếu không tìm thấy bài viết
        if (!post) {
            res.status(404).json({
                success: false,
                error: "Không tìm thấy bài viết!"
            });
            return;
        }

        // BẢO MẬT: Kiểm tra quyền sở hữu
        if (post.author.toString() !== userId.toString()) {
            res.status(403).json({
                success: false,
                error: "Bạn không có quyền xóa bài viết này!"
            });
            return;
        }

        await post.deleteOne();

        // Trả về thông báo
        res.status(200).json({
            success: true,
            data: {
                message: "Blog post deleted"
            }
        });

    } catch (error) {
        console.error("[Delete Blog Post Error]: ", error);
        res.status(500).json({
            success: false,
            error: "Lỗi hệ thống khi xóa bài viết!"
        });
    }

}