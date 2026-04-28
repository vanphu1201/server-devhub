import { Router } from "express";
import * as controller from "../controllers/user.controller";

const route: Router = Router();


route.get('/:userId', controller.profileById);


export const usersRoute: Router = route;