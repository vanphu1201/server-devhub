import { Router, Request, Response } from "express";
import * as controller from "../controllers/blog.controller";
import { optionalAuth, requireAdmin, requireAuth } from "../middlewares/auth.middleware";
import multer from "multer";
import { uploadCloud } from "../middlewares/uploadCloudinary";

const route: Router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// blog/posts
route.get('/posts', optionalAuth, controller.getPosts);
route.get('/posts/:idOrSlug', controller.getPost);
route.get('/admin/posts', requireAuth, requireAdmin, controller.getAllPosts);
route.post('/posts', requireAuth, controller.postBlogPost);
route.put('/posts/:postId', requireAuth, controller.putBlogPost);
route.delete('/posts/:postId', requireAuth, controller.deleteBlogPost);
route.post('/admin/posts/:postId/approve', requireAuth, requireAdmin, controller.adminApproveBlogPost);
route.get('/posts/:postId/like', requireAuth, controller.getBlogPostLike);
route.delete('/posts/:postId/like', requireAuth, controller.deleteBlogPostLike);
route.get('/posts/:postId/is-liked', requireAuth, controller.getIsLiked);
route.post('/posts/:postId/bookmark', requireAuth, controller.postBookMark);
route.delete('/posts/:postId/bookmark', requireAuth, controller.deleteBookMark);
route.get('/posts/:postId/is-bookmarked', requireAuth, controller.getBookMark);
route.post('/posts/:postId/view', controller.increasingView);

// blog/series
route.get('/series', controller.getSeries);
route.get('/series/:idOrSlug', controller.getSeriesWithAllPost);
route.get('/admin/series', requireAuth, requireAdmin, controller.getAllSeriesAdmin);




export const blogRoute: Router = route;