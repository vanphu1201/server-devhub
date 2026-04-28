import { Router } from "express";
import * as controller from "../controllers/user.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const route: Router = Router();


route.get('/:identifier', controller.identifier);
route.put('/profile', requireAuth, controller.profile);


export const usersRoute: Router = route;