import { Router, Request, Response } from "express";
import * as controller from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const route: Router = Router();


route.post('/signup', controller.signup);
route.post('/login', controller.login);
route.post('/login/github', controller.loginGithub);
route.post('/login/google', controller.loginGoogle);
route.post('/forgot-password', controller.forgotPassword);
route.post('/reset-password', controller.resetPassword);
route.post('/update-password', requireAuth, controller.updatePassword);


export const authRoute: Router = route;