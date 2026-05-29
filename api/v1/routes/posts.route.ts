import { Router, Request, Response } from "express";
import * as controller from "../controllers/posts.controller";
import { requireAuth, optionalAuth } from "../middlewares/auth.middleware";
import multer from "multer";
import { uploadCloud } from "../middlewares/uploadCloudinary";

const route: Router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Quản lý Posts
route.get('/', optionalAuth, controller.getPosts);
route.get('/:postId', optionalAuth, controller.getPost);
route.post('/', requireAuth, controller.createPost);
route.delete('/:postId', requireAuth, controller.deletePost);
route.post('/:postId/upload-image', requireAuth, upload.single("file"), uploadCloud, controller.uploadPostImage);

// Tương tác Posts
route.post('/:postId/like', requireAuth, controller.likePost);
route.delete('/:postId/like', requireAuth, controller.unlikePost);
route.get('/:postId/is-liked', requireAuth, controller.getPostIsLiked);

// Bookmarks & Comments
route.post('/:postId/bookmark', requireAuth, controller.bookmark);
route.delete('/:postId/bookmark', requireAuth, controller.unBookmark);
route.get('/:postId/is-bookmarked', requireAuth, controller.isBookmarked);
route.get('/:postId/comments', controller.getComments);
route.post('/:postId/comments', requireAuth, controller.postComments);
route.delete('/:postId/comments/:commentId', requireAuth, controller.deleteComments);
route.post('/:postId/comments/:commentId/like', requireAuth, controller.likeCommentPost);
route.delete('/:postId/comments/:commentId/like', requireAuth, controller.DeleteLikeCommentPost);
route.get('/:postId/comments/:commentId/is-liked', requireAuth, controller.isLiked);

export const postsRoute: Router = route;