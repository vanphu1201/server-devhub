import { Request, Response } from "express";
import { ExtendRequest } from "../../../helpers/extendRequest";
import BlogPost from "../models/blog_posts.model";
import mongoose from "mongoose";
import { error } from "node:console";
import BlogSeries from "../models/blog_series.model";

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

// [POST] /api/v1/blog/admin/posts/:postId/approve
export const adminApproveBlogPost = async (req: ExtendRequest, res: Response) => {
    try {
        const { postId } = req.params;
        const userId = req.user?.id;
        const role = req.user?.role;

        // Kiểm tra postId có hợp lệ không
        if (!mongoose.isValidObjectId(postId)) {
            res.status(400).json({
                success: false,
                error: "ID bài viết không hợp lệ!"
            });
            return;
        }

        // Kiểm tra postId có tồn tại không
        const blogPost = await BlogPost.findByIdAndUpdate(postId, {
            status: "approved"
        }, {
            new: true
        });

        // Nếu không tồn tại thì trả về lỗi
        if (!blogPost) {
            res.status(404).json({
                success: false,
                error: "Bài đăng này không tồn tại!"
            });
            return;
        }

        // nếu tồn tại thì update approve và trả data cho client
        res.status(200).json({
            success: true,
            data: {
                message: "Blog post approved",
                post: blogPost
            }
        });
        return;

    } catch (error) {
        console.error("[Admin Approve Blog Post Error]: ", error);
        res.status(500).json({
            success: false,
            error: "Lỗi hệ thống, vui lòng thử lại sau!"
        });
    }
}

// [GET] /api/v1/blog/posts/:postId/like
export const getBlogPostLike = async (req: ExtendRequest, res: Response) => {
    try {
        const { postId } = req.params;
        const userId = req.user?.id;

        // Kiểm tra ID bài viết hợp lệ
        if (!mongoose.isValidObjectId(postId)) {
            res.status(400).json({
                success: false,
                error: "ID bài viết không hợp lệ!"
            });
            return;
        }

        // TRUY VẤN TỐI ƯU: Thêm ID user vào mảng likes và chỉ select đúng trường likes về
        const post = await BlogPost.findByIdAndUpdate(
            postId,
            { $addToSet: { likes: userId } },
            { new: true }
        )
            .select("likes")
            .lean();

        // Nếu không tìm thấy bài viết
        if (!post) {
            res.status(404).json({
                success: false,
                error: "Bài viết không tồn tại!"
            });
            return;
        }

        // Trả về kết quả
        res.status(200).json({
            success: true,
            data: {
                liked: true,
                likesCount: Array.isArray(post.likes) ? post.likes.length : 0
            }
        });

    } catch (error) {
        console.error("[Like Blog Post Error]: ", error);
        res.status(500).json({
            success: false,
            error: "Lỗi hệ thống khi thả tim bài viết!"
        });
    }
}

// [DELETE] /api/v1/blog/posts/:postId/like
export const deleteBlogPostLike = async (req: ExtendRequest, res: Response) => {
    try {
        const { postId } = req.params;
        const userId = req.user?.id;

        // Kiểm tra postId có hợp lệ không
        if (!mongoose.isValidObjectId(postId)) {
            res.status(400).json({
                success: false,
                error: "ID bài viết không hợp lệ!"
            });
            return;
        }

        // Rút userId khỏi mảng likes và lấy về dữ liệu mới nhất
        const updatedPost = await BlogPost.findByIdAndUpdate(
            postId,
            { $pull: { likes: userId } },
            { new: true }
        )
            .select("likes")
            .lean();

        // Nếu không tìm thấy bài viết
        if (!updatedPost) {
            res.status(404).json({
                success: false,
                error: "Bài viết không tồn tại!"
            });
            return;
        }

        // Đảm bảo an toàn cho mảng
        const likesArray = Array.isArray(updatedPost.likes) ? updatedPost.likes : [];

        // Trả về kết quả cho Client
        res.status(200).json({
            success: true,
            data: {
                liked: false,
                likesCount: likesArray.length
            }
        });

    } catch (error) {
        console.error("[Unlike Blog Post Error]: ", error);
        res.status(500).json({
            success: false,
            error: "Lỗi hệ thống khi bỏ thích bài viết!"
        });
    }
}

// [GET] /api/v1/blog/posts/:postId/is-liked
export const getIsLiked = async (req: ExtendRequest, res: Response) => {
    try {
        const { postId } = req.params;
        const userId = req.user?.id;

        if (!mongoose.isValidObjectId(postId)) {
            res.status(400).json({ success: false, error: "Id bài đăng không hợp lệ!" });
            return;
        }

        // TỐI ƯU RAM: Thêm .select("likes")
        const blogPost = await BlogPost.findById(postId).select("likes").lean();

        if (!blogPost) {
            res.status(404).json({ success: false, error: "Bài đăng không tồn tại!" });
            return;
        }

        // FIX LỖI: So sánh chính xác ObjectId với String
        const likesArray = Array.isArray(blogPost.likes) ? blogPost.likes : [];
        const isUserLiked = userId ? likesArray.some(id => id.toString() === userId.toString()) : false;

        res.status(200).json({
            success: true,
            data: {
                isLiked: isUserLiked
            }
        });
        return;

    } catch (error) {
        console.log("Is Liking Blog Post Error: ", error);
        res.status(500).json({ success: false, error: "Lỗi hệ thống, vui lòng thử lại sau!" });
        return;
    }
}

// [POST] /api/v1/blog/posts/:postId/bookmark
export const postBookMark = async (req: ExtendRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { postId } = req.params;

        // Kiểm tra id bài viết có hợp lệ không
        if (!mongoose.isValidObjectId(postId)) {
            res.status(400).json({
                success: false,
                error: "Id bài viết không hợp lệ!"
            });
            return;
        }

        // Kiểm tra có tồn tại không, nếu tồn tại thfi update luôn
        const updatedBlogPost = await BlogPost.findByIdAndUpdate(
            postId,
            { $addToSet: { bookmarks: userId } },
        )

        // Nếu không tồn tại
        if (!updatedBlogPost) {
            res.status(404).json({
                success: false,
                error: "Bài viết không tồn tại!"
            });
            return;
        }

        // Trả data về cho client
        res.status(200).json({
            success: true,
            data: {
                bookmarked: true
            }
        });
        return;

    } catch (error) {
        console.log("Book Mark Blog Post Error: ", error);
        res.status(500).json({
            success: false,
            error: "Lỗi hệ thống, vui lòng thử lại sau!"
        });
        return;
    }
}

// [DELETE] /api/v1/blog/posts/:postId/bookmark
export const deleteBookMark = async (req: ExtendRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { postId } = req.params;

        // Kiểm tra id bài viết có hợp lệ không
        if (!mongoose.isValidObjectId(postId)) {
            res.status(400).json({
                success: false,
                error: "Id bài viết không hợp lệ!"
            });
            return;
        }

        // Kiểm tra có tồn tại không, nếu tồn tại thì update luôn
        const updatedBlogPost = await BlogPost.findByIdAndUpdate(
            postId,
            { $pull: { bookmarks: userId } },
        )

        // Nếu không tồn tại
        if (!updatedBlogPost) {
            res.status(404).json({
                success: false,
                error: "Bài viết không tồn tại!"
            });
            return;
        }

        // Trả data về cho client
        res.status(200).json({
            success: true,
            data: {
                bookmarked: false
            }
        });
        return;

    } catch (error) {
        console.log("Delete Book Mark Blog Post Error: ", error);
        res.status(500).json({
            success: false,
            error: "Lỗi hệ thống, vui lòng thử lại sau!"
        });
        return;
    }
}

// [GET] /api/v1/blog/posts/:postId/is-bookmarked
export const getBookMark = async (req: ExtendRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { postId } = req.params;

        if (!mongoose.isValidObjectId(postId)) {
            res.status(400).json({ success: false, error: "Id bài viết không hợp lệ!" });
            return;
        }

        const blogPost = await BlogPost.findById(postId).select("bookmarks").lean();

        if (!blogPost) {
            res.status(404).json({ success: false, error: "Bài viết không tồn tại!" });
            return;
        }

        // FIX LỖI: So sánh chính xác ObjectId với String
        const bookmarksArray = Array.isArray(blogPost.bookmarks) ? blogPost.bookmarks : [];
        const isUserBookmarked = userId ? bookmarksArray.some(id => id.toString() === userId.toString()) : false;

        res.status(200).json({
            success: true,
            data: {
                isBookmarked: isUserBookmarked
            }
        });
        return;

    } catch (error) {
        console.log("Get Book Mark Blog Post Error: ", error);
        res.status(500).json({ success: false, error: "Lỗi hệ thống, vui lòng thử lại sau!" });
        return;
    }
}

// [POST] /api/v1/blog/posts/:postId/view
export const increasingView = async (req: ExtendRequest, res: Response) => {
    try {
        const { postId } = req.params;

        // Kiểm tra id bài viết có hợp lệ không
        if (!mongoose.isValidObjectId(postId)) {
            res.status(400).json({
                success: false,
                error: "Id bài viết không hợp lệ!"
            });
            return;
        }

        // Kiểm tra blog post có tồn tại không
        const updatedBlogPost = await BlogPost.findByIdAndUpdate(
            postId,
            { $inc: { views: 1 } },
            { new: true }
        )
            .select("views")
            .lean();

        // Nếu không tồn tại
        if (!updatedBlogPost) {
            res.status(404).json({
                success: false,
                error: "Bài viết không tồn tại!"
            });
            return;
        }

        // Trả data về cho client
        res.status(200).json({
            success: true,
            data: {
                views: updatedBlogPost.views
            }
        });
        return;

    } catch (error) {
        console.log("Increasing View Blog Post Error: ", error);
        res.status(500).json({
            success: false,
            error: "Lỗi hệ thống, vui lòng thử lại sau!"
        });
        return;
    }
}


// [GET] /api/v1/blog/series?limit=20&offset=0&search=keyword
export const getSeries = async (req: ExtendRequest, res: Response) => {
    try {
        // Lấy và chuẩn hóa Params từ Query String
        const search = req.query.search as string;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;

        // Xây dựng bộ lọc tìm kiếm (Query)
        const query: any = {};
        if (search) {
            // Tìm kiếm tương đối (không phân biệt hoa thường) trong Tiêu đề hoặc Mô tả
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
            ];
        }

        // Truy vấn song song: Vừa lấy danh sách, vừa đếm tổng số lượng
        const [seriesList, total] = await Promise.all([
            BlogSeries.find(query)
                .sort({ createdAt: -1 }) // Ưu tiên series mới nhất lên đầu
                .skip(offset)
                .limit(limit)
                .populate("author", "-password")
                .lean(),
            BlogSeries.countDocuments(query)
        ]);

        // Format dữ liệu
        const formattedSeries = seriesList.map(series => {
            // Đảm bảo an toàn cho mảng posts
            const postsArray = Array.isArray(series.posts) ? series.posts : [];

            return {
                id: series._id,
                title: series.title,
                slug: series.slug,
                description: series.description,
                image: series.image,
                author: series.author,
                postsCount: postsArray.length,
                createdAt: series.createdAt
            };
        });

        // Trả kết quả thành công cho Client
        res.status(200).json({
            success: true,
            data: {
                series: formattedSeries,
                total: total
            }
        });
        return;

    } catch (error) {
        console.log("Get Blog Series Error: ", error);
        res.status(500).json({
            success: false,
            error: "Lỗi hệ thống, vui lòng thử lại sau!"
        });
        return;
    }
}

// [GET] /api/v1/blog/series/:idOrSlug
export const getSeriesWithAllPost = async (req: ExtendRequest, res: Response) => {
    try {
        const { idOrSlug } = req.params;

        if (!idOrSlug) {
            res.status(400).json({
                success: false,
                error: "Vui lòng truyền ID hoặc Slug của series!"
            });
            return;
        }

        // Phân loại Query: Tìm theo ID hay Slug
        let query: any = {};
        if (mongoose.isValidObjectId(idOrSlug)) {
            query = { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] };
        } else {
            query = { slug: idOrSlug };
        }

        // Vừa tìm, vừa populate thông tin tác giả và danh sách posts
        const series = await BlogSeries.findOneAndUpdate(
            query,
            { new: true }
        )
            .populate("author", "-password")
            .populate({
                path: "posts",
                select: "title slug content excerpt status createdAt",
                match: { status: "approved" } // Chỉ lấy các bài viết đã được duyệt
            })
            .lean();

        // Nếu không tìm thấy series
        if (!series) {
            res.status(404).json({
                success: false,
                error: "Series không tồn tại!"
            });
            return;
        }

        // Chuẩn hóa dữ liệu mảng posts và thêm số thứ tự (order)
        const rawPosts = Array.isArray(series.posts) ? series.posts : [];

        const formattedPosts = rawPosts.map((post: any, index: number) => ({
            id: post._id,
            title: post.title,
            slug: post.slug,
            order: index + 1, // Tự động gán thứ tự dựa trên vị trí của mảng (đã ordered trong DB)
            content: post.content,
            excerpt: post.excerpt,
            createdAt: post.createdAt
        }));

        // Trả kết quả chuẩn JSON
        res.status(200).json({
            success: true,
            data: {
                id: series._id,
                title: series.title,
                slug: series.slug,
                description: series.description,
                image: series.image,
                author: series.author,
                posts: formattedPosts,
                createdAt: series.createdAt
            }
        });
        return;

    } catch (error) {
        console.error("[Get Series Detail Error]: ", error);
        res.status(500).json({
            success: false,
            error: "Lỗi hệ thống khi lấy chi tiết series!"
        });
        return;
    }
}

// [GET] /api/v1/blog/admin/series
export const getAllSeriesAdmin = async (req: ExtendRequest, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;
        const status = req.query.status as string;

        // Xây dựng bộ lọc
        // Admin xem được tất cả, nhưng vẫn hỗ trợ lọc theo status nếu Admin muốn
        const query: any = {};
        if (status) {
            query.status = status;
        }

        // Truy vấn song song
        const [seriesList, total] = await Promise.all([
            BlogSeries.find(query)
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit)
                .populate("author", "-password")
                .lean(),
            BlogSeries.countDocuments(query)
        ]);

        // Format dữ liệu trả về cho Admin
        const formattedSeries = seriesList.map(series => {
            const postsArray = Array.isArray(series.posts) ? series.posts : [];

            return {
                id: series._id,
                title: series.title,
                slug: series.slug,
                description: series.description,
                image: series.image,
                author: series.author,
                postsCount: postsArray.length, 
                status: series.status || "public",
                createdAt: series.createdAt,
                updatedAt: series.updatedAt
            };
        });

        // Trả kết quả
        res.status(200).json({
            success: true,
            data: {
                series: formattedSeries,
                total: total
            }
        });
        return;

    } catch (error) {
        console.error("[Get Admin Series Error]: ", error);
        res.status(500).json({
            success: false,
            error: "Lỗi hệ thống khi lấy danh sách series cho Admin!"
        });
        return;
    }
}