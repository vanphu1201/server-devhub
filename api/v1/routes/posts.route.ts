import { Router, Request, Response } from "express";
import * as controller from "../controllers/posts.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import multer from "multer";
import { uploadCloud } from "../middlewares/uploadCloudinary";

const route: Router = Router();
const upload = multer({ storage: multer.memoryStorage() });

route.post('/:postId/bookmark', requireAuth, controller.bookmark);
route.delete('/:postId/bookmark', requireAuth, controller.unBookmark);
route.get('/:postId/is-bookmarked', requireAuth, controller.isBookmarked);
route.get('/:postId/comments', controller.getComments);
route.post('/:postId/comments', requireAuth, controller.postComments);
route.delete('/:postId/comments/:commentId', requireAuth, controller.deleteComments);
route.post('/:postId/comments/:commentId/like', requireAuth, controller.likeCommentPost);



export const postsRoute: Router = route;