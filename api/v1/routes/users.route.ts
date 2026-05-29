import { Router } from "express";
import * as controller from "../controllers/user.controller";
import { optionalAuth, requireAuth } from "../middlewares/auth.middleware";
import multer from "multer";
import { uploadCloud } from "../middlewares/uploadCloudinary";
import { getUserProducts, getUserPurchases } from "../controllers/products.controller";
import { getUserUnlockedResources } from "../controllers/resources.controller";

const route: Router = Router();
// Khởi tạo multer lưu RAM
const upload = multer({ storage: multer.memoryStorage() });

route.get('/:identifier', controller.identifier);
route.put('/profile', requireAuth, controller.profile);
route.post(
    '/avatar',
    requireAuth,
    upload.single("avatar"),
    uploadCloud,
    controller.avatar
);
route.post(
    '/cover',
    requireAuth,
    upload.single("cover"),
    uploadCloud,
    controller.cover
);
route.post('/:userId/follow', requireAuth, controller.follow);
route.delete('/:userId/follow', requireAuth, controller.unFollow);
route.get('/:userId/is-following', requireAuth, controller.isFollowing);
route.get('/:userId/blog/posts', optionalAuth, controller.getBlogPostsUser);
route.get('/:userId/blog/series', optionalAuth, controller.getBlogSeriesUser);
route.get('/:userId/posts', optionalAuth, controller.getUserPosts);
route.get('/:userId/products', optionalAuth, getUserProducts);
route.get('/:userId/purchases', requireAuth, getUserPurchases);
route.get('/:userId/resources/purchases', requireAuth, getUserUnlockedResources);
route.get('/:userId/badges', optionalAuth, controller.getUserBadges);

export const usersRoute: Router = route;