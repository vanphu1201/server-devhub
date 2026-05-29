import { Request, Response } from "express";
import User from "../models/users.model";
import Post from "../models/posts.model";
import BlogPost from "../models/blog_posts.model";
import Product from "../models/products.model";

// [GET] /api/v1/search
export const globalSearch = async (req: Request, res: Response) => {
    try {
        const q = req.query.q as string;
        if (!q || !q.trim()) {
            res.status(200).json({
                success: true,
                data: {
                    users: [],
                    posts: [],
                    blogs: [],
                    products: []
                }
            });
            return;
        }

        const searchPattern = new RegExp(q.trim(), "i");

        const [users, posts, blogs, products] = await Promise.all([
            User.find({
                $or: [
                    { displayName: { $regex: searchPattern } },
                    { username: { $regex: searchPattern } }
                ]
            }).limit(5).select("displayName username avatar reputation").lean(),

            Post.find({
                content: { $regex: searchPattern }
            }).limit(5).select("content author createdAt").populate("author", "displayName avatar").lean(),

            BlogPost.find({
                status: "approved",
                $or: [
                    { title: { $regex: searchPattern } },
                    { content: { $regex: searchPattern } }
                ]
            }).limit(5).select("title slug excerpt images author createdAt").populate("author", "displayName avatar").lean(),

            Product.find({
                status: "approved",
                $or: [
                    { title: { $regex: searchPattern } },
                    { description: { $regex: searchPattern } }
                ]
            }).limit(5).select("title slug price currency image author rating sales").populate("author", "displayName avatar").lean()
        ]);

        res.status(200).json({
            success: true,
            data: {
                users: users.map((u: any) => ({ id: u._id, ...u })),
                posts: posts.map((p: any) => ({ id: p._id, ...p })),
                blogs: blogs.map((b: any) => ({ id: b._id, ...b })),
                products: products.map((prod: any) => ({ id: prod._id, ...prod }))
            }
        });

    } catch (error) {
        console.error("[Global Search Error]: ", error);
        res.status(500).json({ success: false, error: "Lỗi hệ thống khi tìm kiếm!" });
    }
};
