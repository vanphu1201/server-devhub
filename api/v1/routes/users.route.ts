import { Router } from "express";
import * as controller from "../controllers/user.controller";

const route: Router = Router();


route.get('/:identifier', controller.identifier);



export const usersRoute: Router = route;