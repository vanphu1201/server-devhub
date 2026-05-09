import { Request, Response } from "express";
import { ExtendRequest } from "../../../helpers/extendRequest";
import BlogPost from "../modules/blog_posts.module";

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