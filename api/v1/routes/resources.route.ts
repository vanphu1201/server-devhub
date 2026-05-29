import { Router } from "express";
import * as controller from "../controllers/resources.controller";
import { requireAuth, requireAdmin, optionalAuth } from "../middlewares/auth.middleware";

const route = Router();

route.post("/", requireAuth, requireAdmin, controller.createResource);
route.get("/", optionalAuth, controller.getResources);
route.get("/admin/all", requireAuth, requireAdmin, controller.getAdminAllResources);

route.get("/:resourceId", optionalAuth, controller.getResource);
route.put("/:resourceId", requireAuth, requireAdmin, controller.updateResource);
route.delete("/:resourceId", requireAuth, requireAdmin, controller.deleteResource);

route.post("/:resourceId/unlock", requireAuth, controller.unlockResource);

export const resourcesRoute = route;
