import { Router } from "express";
import { getUserStats } from "../controllers/user.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const route = Router();

route.get("/user", requireAuth, getUserStats);

export const statsRoute = route;
