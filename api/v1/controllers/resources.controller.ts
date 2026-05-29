import { Response } from "express";
import { ExtendRequest } from "../../../helpers/extendRequest";
import Resource from "../models/resources.model";
import ResourceUnlock from "../models/resource_unlocks.model";
import mongoose from "mongoose";

// [POST] /api/v1/resources
export const createResource = async (req: ExtendRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { title, description, type, fileUrl, isPremium } = req.body;

        if (!title || !description || !type || !fileUrl) {
            res.status(400).json({ success: false, error: "Vui lòng nhập đầy đủ các trường thông tin bắt buộc!" });
            return;
        }

        const newResource = new Resource({
            title: title.trim(),
            description: description,
            type: type,
            fileUrl: fileUrl,
            isPremium: isPremium === true || isPremium === "true",
            author: userId
        });

        await newResource.save();

        res.status(201).json({
            success: true,
            data: {
                id: newResource._id,
                title: newResource.title,
                slug: newResource.slug,
                createdAt: newResource.createdAt
            }
        });

    } catch (error) {
        console.error("[Create Resource Error]: ", error);
        res.status(500).json({ success: false, error: "Lỗi hệ thống khi tải lên tài nguyên!" });
    }
};

// [GET] /api/v1/resources
export const getResources = async (req: ExtendRequest, res: Response) => {
    try {
        const type = req.query.type as string;
        const search = req.query.search as string;
        const isPremium = req.query.isPremium as string;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;

        const query: any = {};
        if (type) {
            query.type = type;
        }
        if (isPremium !== undefined) {
            query.isPremium = isPremium === "true";
        }
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
            ];
        }

        const [resources, total] = await Promise.all([
            Resource.find(query)
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit)
                .populate("author", "displayName avatar")
                .lean(),
            Resource.countDocuments(query)
        ]);

        const formattedResources = resources.map((r: any) => {
            // Đối với danh sách công khai, nếu tài nguyên là premium thì ẩn fileUrl
            const { fileUrl, ...publicRes } = r;
            return {
                id: publicRes._id,
                ...publicRes,
                fileUrl: r.isPremium ? null : r.fileUrl
            };
        });

        res.status(200).json({
            success: true,
            data: {
                items: formattedResources,
                total: total
            }
        });

    } catch (error) {
        console.error("[Get Resources Error]: ", error);
        res.status(500).json({ success: false, error: "Lỗi hệ thống khi lấy danh sách tài nguyên!" });
    }
};

// [GET] /api/v1/resources/:resourceId
export const getResource = async (req: ExtendRequest, res: Response) => {
    try {
        const { resourceId } = req.params;
        const userId = req.user?.id;
        const role = req.user?.role;

        let query: any = {};
        if (mongoose.isValidObjectId(resourceId)) {
            query = { _id: resourceId };
        } else {
            query = { slug: resourceId };
        }

        const resource = await Resource.findOne(query)
            .populate("author", "displayName avatar")
            .lean();

        if (!resource) {
            res.status(404).json({ success: false, error: "Tài nguyên không tồn tại!" });
            return;
        }

        let isUnlocked = false;
        if (resource.isPremium) {
            if (userId) {
                const unlock = await ResourceUnlock.findOne({ user: userId, resource: resource._id });
                if (unlock || role === 'admin' || resource.author._id.toString() === userId.toString()) {
                    isUnlocked = true;
                }
            }
        } else {
            isUnlocked = true;
        }

        // Tăng số lượt tải nếu người dùng tải/xem tài nguyên hợp lệ
        if (isUnlocked) {
            await Resource.findByIdAndUpdate(resource._id, { $inc: { downloads: 1 } });
        }

        const responseData = {
            id: resource._id,
            title: resource.title,
            slug: resource.slug,
            description: resource.description,
            type: resource.type,
            isPremium: resource.isPremium,
            author: resource.author,
            downloads: resource.downloads,
            rating: resource.rating,
            createdAt: resource.createdAt,
            fileUrl: isUnlocked ? resource.fileUrl : null,
            isUnlocked: isUnlocked
        };

        res.status(200).json({
            success: true,
            data: responseData
        });

    } catch (error) {
        console.error("[Get Single Resource Error]: ", error);
        res.status(500).json({ success: false, error: "Lỗi hệ thống khi lấy chi tiết tài nguyên!" });
    }
};

// [PUT] /api/v1/resources/:resourceId
export const updateResource = async (req: ExtendRequest, res: Response) => {
    try {
        const { resourceId } = req.params;
        const userId = req.user?.id;

        if (!mongoose.isValidObjectId(resourceId)) {
            res.status(400).json({ success: false, error: "ID tài nguyên không hợp lệ!" });
            return;
        }

        const resource = await Resource.findById(resourceId);
        if (!resource) {
            res.status(404).json({ success: false, error: "Tài nguyên không tồn tại!" });
            return;
        }

        // Chỉ Admin hoặc tác giả mới được cập nhật
        if (resource.author.toString() !== userId.toString() && req.user?.role !== 'admin') {
            res.status(403).json({ success: false, error: "Bạn không có quyền sửa tài nguyên này!" });
            return;
        }

        const { title, description, type, fileUrl, isPremium } = req.body;

        if (title) resource.title = title.trim();
        if (description) resource.description = description;
        if (type) resource.type = type;
        if (fileUrl) resource.fileUrl = fileUrl;
        if (isPremium !== undefined) resource.isPremium = isPremium === true || isPremium === "true";

        await resource.save();

        res.status(200).json({
            success: true,
            message: "Cập nhật tài nguyên thành công!",
            data: {
                id: resource._id,
                title: resource.title,
                slug: resource.slug,
                updatedAt: resource.updatedAt
            }
        });

    } catch (error) {
        console.error("[Update Resource Error]: ", error);
        res.status(500).json({ success: false, error: "Lỗi hệ thống khi cập nhật tài nguyên!" });
    }
};

// [DELETE] /api/v1/resources/:resourceId
export const deleteResource = async (req: ExtendRequest, res: Response) => {
    try {
        const { resourceId } = req.params;
        const userId = req.user?.id;

        if (!mongoose.isValidObjectId(resourceId)) {
            res.status(400).json({ success: false, error: "ID tài nguyên không hợp lệ!" });
            return;
        }

        const resource = await Resource.findById(resourceId);
        if (!resource) {
            res.status(404).json({ success: false, error: "Tài nguyên không tồn tại!" });
            return;
        }

        if (resource.author.toString() !== userId.toString() && req.user?.role !== 'admin') {
            res.status(403).json({ success: false, error: "Bạn không có quyền xóa tài nguyên này!" });
            return;
        }

        await resource.deleteOne();

        res.status(200).json({
            success: true,
            data: { message: "Resource deleted" }
        });

    } catch (error) {
        console.error("[Delete Resource Error]: ", error);
        res.status(500).json({ success: false, error: "Lỗi hệ thống khi xóa tài nguyên!" });
    }
};

// [POST] /api/v1/resources/:resourceId/unlock
export const unlockResource = async (req: ExtendRequest, res: Response) => {
    try {
        const { resourceId } = req.params;
        const userId = req.user?.id;

        if (!mongoose.isValidObjectId(resourceId)) {
            res.status(400).json({ success: false, error: "ID tài nguyên không hợp lệ!" });
            return;
        }

        const resource = await Resource.findById(resourceId);
        if (!resource) {
            res.status(404).json({ success: false, error: "Tài nguyên không tồn tại!" });
            return;
        }

        if (!resource.isPremium) {
            res.status(400).json({ success: false, error: "Tài nguyên này hoàn toàn miễn phí, không cần mở khóa!" });
            return;
        }

        const existingUnlock = await ResourceUnlock.findOne({ user: userId, resource: resourceId });
        if (existingUnlock) {
            res.status(400).json({ success: false, error: "Bạn đã mở khóa tài nguyên này trước đó!" });
            return;
        }

        const newUnlock = new ResourceUnlock({
            user: userId,
            resource: resourceId
        });

        await newUnlock.save();

        res.status(200).json({
            success: true,
            message: "Mở khóa tài nguyên thành công!",
            data: {
                resourceId: resourceId,
                fileUrl: resource.fileUrl
            }
        });

    } catch (error) {
        console.error("[Unlock Resource Error]: ", error);
        res.status(500).json({ success: false, error: "Lỗi hệ thống khi mở khóa tài nguyên!" });
    }
};

// [GET] /api/v1/users/:userId/resources/purchases
export const getUserUnlockedResources = async (req: ExtendRequest, res: Response) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;

        if (!mongoose.isValidObjectId(userId)) {
            res.status(400).json({ success: false, error: "ID người dùng không hợp lệ!" });
            return;
        }

        const [unlocks, total] = await Promise.all([
            ResourceUnlock.find({ user: userId })
                .sort({ unlockedAt: -1 })
                .skip(offset)
                .limit(limit)
                .populate("resource")
                .lean(),
            ResourceUnlock.countDocuments({ user: userId })
        ]);

        const formattedResources = unlocks.map((u: any) => ({
            id: u._id,
            resource: u.resource ? {
                id: u.resource._id,
                title: u.resource.title,
                slug: u.resource.slug,
                type: u.resource.type,
                fileUrl: u.resource.fileUrl
            } : null,
            unlockedAt: u.unlockedAt
        }));

        res.status(200).json({
            success: true,
            data: {
                items: formattedResources,
                total: total
            }
        });

    } catch (error) {
        console.error("[Get Unlocked Resources Error]: ", error);
        res.status(500).json({ success: false, error: "Lỗi hệ thống khi lấy tài nguyên đã mở khóa!" });
    }
};

// [GET] /api/v1/resources/admin/all
export const getAdminAllResources = async (req: ExtendRequest, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;

        const [resources, total] = await Promise.all([
            Resource.find()
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit)
                .populate("author", "displayName email")
                .lean(),
            Resource.countDocuments()
        ]);

        const formattedResources = resources.map((r: any) => ({
            id: r._id,
            title: r.title,
            slug: r.slug,
            type: r.type,
            isPremium: r.isPremium,
            author: r.author,
            downloads: r.downloads,
            createdAt: r.createdAt
        }));

        res.status(200).json({
            success: true,
            data: {
                items: formattedResources,
                total: total
            }
        });

    } catch (error) {
        console.error("[Admin Get Resources Error]: ", error);
        res.status(500).json({ success: false, error: "Lỗi hệ thống khi lấy toàn bộ tài nguyên cho Admin!" });
    }
};
