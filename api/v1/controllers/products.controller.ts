import { Response } from "express";
import { ExtendRequest } from "../../../helpers/extendRequest";
import Product from "../models/products.model";
import Purchase from "../models/purchases.model";
import Review from "../models/reviews.model";
import mongoose from "mongoose";

// [POST] /api/v1/products
export const createProduct = async (req: ExtendRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, error: "Vui lòng đăng nhập!" });
            return;
        }

        const { title, description, image, price, currency, category, tags, downloadUrl, preview } = req.body;

        if (!title || !description || !image || price === undefined || !category || !downloadUrl) {
            res.status(400).json({
                success: false,
                error: "Vui lòng điền đầy đủ các thông tin bắt buộc!"
            });
            return;
        }

        const newProduct = new Product({
            title: title.trim(),
            description: description,
            image: image,
            price: price,
            currency: currency || "VND",
            category: category,
            tags: Array.isArray(tags) ? tags : [],
            author: userId,
            downloadUrl: downloadUrl,
            preview: preview || "",
            status: "approved" // Mặc định duyệt để hiển thị ngay
        });

        await newProduct.save();

        res.status(201).json({
            success: true,
            data: {
                id: newProduct._id,
                title: newProduct.title,
                slug: newProduct.slug,
                createdAt: newProduct.createdAt
            }
        });

    } catch (error) {
        console.error("[Create Product Error]: ", error);
        res.status(500).json({ success: false, error: "Lỗi hệ thống khi tạo sản phẩm!" });
    }
};

// [GET] /api/v1/products
export const getProducts = async (req: ExtendRequest, res: Response) => {
    try {
        const category = req.query.category as string;
        const search = req.query.search as string;
        const sortBy = req.query.sortBy as string || 'latest';
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;

        const query: any = { status: "approved" };

        if (category) {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { tags: { $regex: search, $options: "i" } }
            ];
        }

        let sortObj: any = { createdAt: -1 };
        if (sortBy === 'popular') {
            sortObj = { sales: -1, createdAt: -1 };
        } else if (sortBy === 'rating') {
            sortObj = { rating: -1, createdAt: -1 };
        } else if (sortBy === 'price_asc') {
            sortObj = { price: 1, createdAt: -1 };
        } else if (sortBy === 'price_desc') {
            sortObj = { price: -1, createdAt: -1 };
        }

        const [products, total] = await Promise.all([
            Product.find(query)
                .sort(sortObj)
                .skip(offset)
                .limit(limit)
                .populate("author", "displayName avatar reputation")
                .lean(),
            Product.countDocuments(query)
        ]);

        const formattedProducts = products.map((prod: any) => {
            // Không trả về downloadUrl trong danh sách công khai
            const { downloadUrl, ...publicProd } = prod;
            return {
                id: publicProd._id,
                ...publicProd
            };
        });

        res.status(200).json({
            success: true,
            data: {
                items: formattedProducts,
                total: total,
                limit: limit,
                offset: offset,
                hasMore: offset + formattedProducts.length < total
            }
        });

    } catch (error) {
        console.error("[Get Products Error]: ", error);
        res.status(500).json({ success: false, error: "Lỗi hệ thống khi lấy danh sách sản phẩm!" });
    }
};

// [GET] /api/v1/products/featured
export const getFeaturedProducts = async (req: ExtendRequest, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 6;
        const offset = parseInt(req.query.offset as string) || 0;

        const query = { status: "approved", rating: { $gte: 4 } };

        const [products, total] = await Promise.all([
            Product.find(query)
                .sort({ sales: -1, rating: -1 })
                .skip(offset)
                .limit(limit)
                .populate("author", "displayName avatar")
                .lean(),
            Product.countDocuments(query)
        ]);

        const formattedProducts = products.map((prod: any) => {
            const { downloadUrl, ...publicProd } = prod;
            return {
                id: publicProd._id,
                ...publicProd
            };
        });

        res.status(200).json({
            success: true,
            data: {
                items: formattedProducts,
                total: total,
                limit: limit,
                offset: offset,
                hasMore: offset + formattedProducts.length < total
            }
        });

    } catch (error) {
        console.error("[Get Featured Products Error]: ", error);
        res.status(500).json({ success: false, error: "Lỗi hệ thống khi lấy sản phẩm nổi bật!" });
    }
};

// [GET] /api/v1/products/:productId
export const getProduct = async (req: ExtendRequest, res: Response) => {
    try {
        const { productId } = req.params;
        const userId = req.user?.id;

        let query: any = {};
        if (mongoose.isValidObjectId(productId)) {
            query = { _id: productId };
        } else {
            query = { slug: productId };
        }

        const product = await Product.findOne(query)
            .populate("author", "displayName avatar reputation joinedDate bio")
            .lean();

        if (!product) {
            res.status(404).json({ success: false, error: "Sản phẩm không tồn tại!" });
            return;
        }

        // Kiểm tra xem người dùng hiện tại đã mua sản phẩm chưa
        let hasPurchased = false;
        if (userId) {
            const purchase = await Purchase.findOne({ user: userId, product: product._id, status: "completed" });
            if (purchase) {
                hasPurchased = true;
            }
        }

        const isAuthor = userId && product.author._id.toString() === userId.toString();
        const isAdmin = req.user?.role === 'admin';

        // Bảo mật downloadUrl: Chỉ tác giả, Admin, hoặc người đã mua mới xem được downloadUrl
        const showDownloadUrl = isAuthor || isAdmin || hasPurchased;
        const responseData = {
            id: product._id,
            title: product.title,
            slug: product.slug,
            description: product.description,
            image: product.image,
            price: product.price,
            currency: product.currency,
            category: product.category,
            tags: product.tags,
            author: product.author,
            preview: product.preview,
            sales: product.sales,
            rating: product.rating,
            hasPurchased: hasPurchased,
            createdAt: product.createdAt,
            downloadUrl: showDownloadUrl ? product.downloadUrl : null
        };

        res.status(200).json({
            success: true,
            data: responseData
        });

    } catch (error) {
        console.error("[Get Single Product Error]: ", error);
        res.status(500).json({ success: false, error: "Lỗi hệ thống khi lấy chi tiết sản phẩm!" });
    }
};

// [PUT] /api/v1/products/:productId
export const updateProduct = async (req: ExtendRequest, res: Response) => {
    try {
        const { productId } = req.params;
        const userId = req.user?.id;

        if (!mongoose.isValidObjectId(productId)) {
            res.status(400).json({ success: false, error: "ID sản phẩm không hợp lệ!" });
            return;
        }

        const product = await Product.findById(productId);
        if (!product) {
            res.status(404).json({ success: false, error: "Không tìm thấy sản phẩm!" });
            return;
        }

        if (product.author.toString() !== userId.toString() && req.user?.role !== 'admin') {
            res.status(403).json({ success: false, error: "Bạn không có quyền cập nhật sản phẩm này!" });
            return;
        }

        const { title, description, image, price, currency, category, tags, downloadUrl, preview } = req.body;

        if (title) product.title = title.trim();
        if (description) product.description = description;
        if (image) product.image = image;
        if (price !== undefined) product.price = price;
        if (currency) product.currency = currency;
        if (category) product.category = category;
        if (tags && Array.isArray(tags)) product.tags = tags;
        if (downloadUrl) product.downloadUrl = downloadUrl;
        if (preview !== undefined) product.preview = preview;

        await product.save();

        res.status(200).json({
            success: true,
            message: "Cập nhật sản phẩm thành công!",
            data: {
                id: product._id,
                title: product.title,
                slug: product.slug,
                updatedAt: product.updatedAt
            }
        });

    } catch (error) {
        console.error("[Update Product Error]: ", error);
        res.status(500).json({ success: false, error: "Lỗi hệ thống khi cập nhật sản phẩm!" });
    }
};

// [DELETE] /api/v1/products/:productId
export const deleteProduct = async (req: ExtendRequest, res: Response) => {
    try {
        const { productId } = req.params;
        const userId = req.user?.id;

        if (!mongoose.isValidObjectId(productId)) {
            res.status(400).json({ success: false, error: "ID sản phẩm không hợp lệ!" });
            return;
        }

        const product = await Product.findById(productId);
        if (!product) {
            res.status(404).json({ success: false, error: "Không tìm thấy sản phẩm!" });
            return;
        }

        if (product.author.toString() !== userId.toString() && req.user?.role !== 'admin') {
            res.status(403).json({ success: false, error: "Bạn không có quyền xóa sản phẩm này!" });
            return;
        }

        await product.deleteOne();

        res.status(200).json({
            success: true,
            data: { message: "Product deleted" }
        });

    } catch (error) {
        console.error("[Delete Product Error]: ", error);
        res.status(500).json({ success: false, error: "Lỗi hệ thống khi xóa sản phẩm!" });
    }
};

// [GET] /api/v1/users/:userId/products
export const getUserProducts = async (req: ExtendRequest, res: Response) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;

        if (!mongoose.isValidObjectId(userId)) {
            res.status(400).json({ success: false, error: "ID người dùng không hợp lệ!" });
            return;
        }

        const [products, total] = await Promise.all([
            Product.find({ author: userId, status: "approved" })
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit)
                .lean(),
            Product.countDocuments({ author: userId, status: "approved" })
        ]);

        const formattedProducts = products.map((prod: any) => {
            const { downloadUrl, ...publicProd } = prod;
            return {
                id: publicProd._id,
                ...publicProd
            };
        });

        res.status(200).json({
            success: true,
            data: {
                items: formattedProducts,
                total: total,
                limit: limit,
                offset: offset
            }
        });

    } catch (error) {
        console.error("[Get User Products Error]: ", error);
        res.status(500).json({ success: false, error: "Lỗi hệ thống khi lấy danh sách sản phẩm!" });
    }
};

// [POST] /api/v1/products/:productId/purchase
export const purchaseProduct = async (req: ExtendRequest, res: Response) => {
    try {
        const { productId } = req.params;
        const userId = req.user?.id;

        if (!mongoose.isValidObjectId(productId)) {
            res.status(400).json({ success: false, error: "ID sản phẩm không hợp lệ!" });
            return;
        }

        const product = await Product.findById(productId);
        if (!product) {
            res.status(404).json({ success: false, error: "Sản phẩm không tồn tại!" });
            return;
        }

        // Kiểm tra xem người dùng đã mua sản phẩm này chưa
        const existingPurchase = await Purchase.findOne({ user: userId, product: productId, status: "completed" });
        if (existingPurchase) {
            res.status(400).json({ success: false, error: "Bạn đã sở hữu sản phẩm này!" });
            return;
        }

        // Tạo đơn hàng mua thành công (Simulate Stripe payment)
        const newPurchase = new Purchase({
            user: userId,
            product: productId,
            amount: product.price,
            currency: product.currency,
            paymentId: "stripe_" + Math.random().toString(36).substring(2, 15),
            status: "completed",
            downloadUrl: product.downloadUrl
        });

        await newPurchase.save();

        // Tăng lượt mua sản phẩm
        product.sales += 1;
        await product.save();

        res.status(200).json({
            success: true,
            message: "Mua sản phẩm thành công!",
            data: {
                purchaseId: newPurchase._id,
                downloadUrl: newPurchase.downloadUrl
            }
        });

    } catch (error) {
        console.error("[Purchase Product Error]: ", error);
        res.status(500).json({ success: false, error: "Lỗi hệ thống khi mua sản phẩm!" });
    }
};

// [GET] /api/v1/users/:userId/purchases
export const getUserPurchases = async (req: ExtendRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;

        const [purchases, total] = await Promise.all([
            Purchase.find({ user: userId, status: "completed" })
                .sort({ purchaseDate: -1 })
                .skip(offset)
                .limit(limit)
                .populate("product")
                .lean(),
            Purchase.countDocuments({ user: userId, status: "completed" })
        ]);

        const formattedPurchases = purchases.map((pur: any) => ({
            id: pur._id,
            product: pur.product ? {
                id: pur.product._id,
                title: pur.product.title,
                slug: pur.product.slug,
                image: pur.product.image,
                price: pur.product.price,
                currency: pur.product.currency
            } : null,
            amount: pur.amount,
            currency: pur.currency,
            purchaseDate: pur.purchaseDate,
            downloadUrl: pur.downloadUrl
        }));

        res.status(200).json({
            success: true,
            data: {
                items: formattedPurchases,
                total: total,
                limit: limit,
                offset: offset
            }
        });

    } catch (error) {
        console.error("[Get User Purchases Error]: ", error);
        res.status(500).json({ success: false, error: "Lỗi hệ thống khi lấy lịch sử mua hàng!" });
    }
};

// [GET] /api/v1/products/:productId/has-purchased
export const hasPurchased = async (req: ExtendRequest, res: Response) => {
    try {
        const { productId } = req.params;
        const userId = req.user?.id;

        if (!mongoose.isValidObjectId(productId)) {
            res.status(400).json({ success: false, error: "ID sản phẩm không hợp lệ!" });
            return;
        }

        const purchase = await Purchase.findOne({ user: userId, product: productId, status: "completed" });

        res.status(200).json({
            success: true,
            data: {
                hasPurchased: !!purchase
            }
        });

    } catch (error) {
        console.error("[Check Purchase Error]: ", error);
        res.status(500).json({ success: false, error: "Lỗi hệ thống khi kiểm tra trạng thái mua hàng!" });
    }
};

// [GET] /api/v1/products/admin/all
export const getAdminAllProducts = async (req: ExtendRequest, res: Response) => {
    try {
        const status = req.query.status as string;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;

        const query: any = {};
        if (status && ["draft", "pending", "approved"].includes(status)) {
            query.status = status;
        }

        const [products, total] = await Promise.all([
            Product.find(query)
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit)
                .populate("author", "displayName email")
                .lean(),
            Product.countDocuments(query)
        ]);

        const formattedProducts = products.map((prod: any) => ({
            id: prod._id,
            title: prod.title,
            slug: prod.slug,
            price: prod.price,
            currency: prod.currency,
            category: prod.category,
            author: prod.author,
            status: prod.status,
            createdAt: prod.createdAt
        }));

        res.status(200).json({
            success: true,
            data: {
                items: formattedProducts,
                total: total
            }
        });

    } catch (error) {
        console.error("[Admin Get Products Error]: ", error);
        res.status(500).json({ success: false, error: "Lỗi hệ thống khi lấy sản phẩm quản trị!" });
    }
};

// [POST] /api/v1/products/:productId/reviews
export const createReview = async (req: ExtendRequest, res: Response) => {
    try {
        const { productId } = req.params;
        const userId = req.user?.id;
        const { rating, content } = req.body;

        if (!mongoose.isValidObjectId(productId)) {
            res.status(400).json({ success: false, error: "ID sản phẩm không hợp lệ!" });
            return;
        }

        if (!rating || rating < 1 || rating > 5 || !content) {
            res.status(400).json({ success: false, error: "Vui lòng nhập đánh giá (1-5 sao) và nội dung!" });
            return;
        }

        const product = await Product.findById(productId);
        if (!product) {
            res.status(404).json({ success: false, error: "Sản phẩm không tồn tại!" });
            return;
        }

        // Chỉ cho phép người đã mua sản phẩm gửi đánh giá
        const purchase = await Purchase.findOne({ user: userId, product: productId, status: "completed" });
        if (!purchase) {
            res.status(403).json({ success: false, error: "Bạn chỉ có thể đánh giá sản phẩm sau khi đã mua!" });
            return;
        }

        // Tạo đánh giá mới
        const newReview = new Review({
            author: userId,
            product: productId,
            rating: rating,
            content: content
        });

        await newReview.save();

        // Cập nhật mảng reviews của Product
        product.reviews.push(newReview._id as any);

        // Tính toán lại xếp hạng trung bình (average rating)
        const reviewsList = await Review.find({ product: productId });
        const sumRating = reviewsList.reduce((sum, r) => sum + r.rating, 0);
        product.rating = parseFloat((sumRating / reviewsList.length).toFixed(1));

        await product.save();

        res.status(201).json({
            success: true,
            data: {
                id: newReview._id,
                rating: newReview.rating,
                content: newReview.content,
                createdAt: newReview.createdAt
            }
        });

    } catch (error) {
        console.error("[Create Review Error]: ", error);
        res.status(500).json({ success: false, error: "Lỗi hệ thống khi gửi đánh giá!" });
    }
};

// [GET] /api/v1/products/:productId/reviews
export const getReviews = async (req: ExtendRequest, res: Response) => {
    try {
        const { productId } = req.params;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;

        let query: any = {};
        if (mongoose.isValidObjectId(productId)) {
            query = { _id: productId };
        } else {
            query = { slug: productId };
        }

        const product = await Product.findOne(query).select("_id").lean();
        if (!product) {
            res.status(404).json({ success: false, error: "Sản phẩm không tồn tại!" });
            return;
        }

        const [reviews, total] = await Promise.all([
            Review.find({ product: product._id })
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit)
                .populate("author", "displayName avatar")
                .lean(),
            Review.countDocuments({ product: product._id })
        ]);

        const formattedReviews = reviews.map((rev: any) => ({
            id: rev._id,
            author: rev.author,
            rating: rev.rating,
            content: rev.content,
            helpful: rev.helpful || 0,
            createdAt: rev.createdAt
        }));

        res.status(200).json({
            success: true,
            data: {
                items: formattedReviews,
                total: total,
                limit: limit,
                offset: offset
            }
        });

    } catch (error) {
        console.error("[Get Reviews Error]: ", error);
        res.status(500).json({ success: false, error: "Lỗi hệ thống khi lấy danh sách đánh giá!" });
    }
};
