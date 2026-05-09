import { Router, Request, Response } from "express";
import * as controller from "../controllers/blog.controller";
import { optionalAuth, requireAuth } from "../middlewares/auth.middleware";
import multer from "multer";
import { uploadCloud } from "../middlewares/uploadCloudinary";

const route: Router = Router();
const upload = multer({ storage: multer.memoryStorage() });

route.get('/posts', optionalAuth, controller.getPosts);
route.get('/posts/:idOrSlug', controller.getPost);


export const blogRoute: Router = route;