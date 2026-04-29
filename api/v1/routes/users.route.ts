import { Router } from "express";
import * as controller from "../controllers/user.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import multer from "multer";
import { uploadCloud } from "../middlewares/uploadCloudinary";

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
route.post('/:userId/follow', requireAuth, controller.follow);

export const usersRoute: Router = route;