import { Router, Request, Response } from "express";
import * as controller from "../controllers/posts.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const route: Router = Router();


route.post('/:postId/bookmark', requireAuth, controller.bookmark);
route.delete('/:postId/bookmark', requireAuth, controller.unBookmark);



export const postsRoute: Router = route;