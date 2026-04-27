import { Router, Request, Response } from "express";
import * as controller from "../controllers/auth.controller";
const route: Router = Router();


route.post('/signup', controller.signup);
route.post('/login', controller.login);

export const authRoute: Router = route;