import { Router } from "express";
import * as controller from "../controllers/search.controller";

const route = Router();

route.get("/", controller.globalSearch);

export const searchRoute = route;
