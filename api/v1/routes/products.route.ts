import { Router } from "express";
import * as controller from "../controllers/products.controller";
import { requireAuth, requireAdmin, optionalAuth } from "../middlewares/auth.middleware";

const route = Router();

route.post("/", requireAuth, controller.createProduct);
route.get("/", optionalAuth, controller.getProducts);
route.get("/featured", optionalAuth, controller.getFeaturedProducts);
route.get("/admin/all", requireAuth, requireAdmin, controller.getAdminAllProducts);

route.get("/:productId", optionalAuth, controller.getProduct);
route.put("/:productId", requireAuth, controller.updateProduct);
route.delete("/:productId", requireAuth, controller.deleteProduct);

route.post("/:productId/purchase", requireAuth, controller.purchaseProduct);
route.get("/:productId/has-purchased", requireAuth, controller.hasPurchased);

route.post("/:productId/reviews", requireAuth, controller.createReview);
route.get("/:productId/reviews", optionalAuth, controller.getReviews);

export const productsRoute = route;
