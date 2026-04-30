import { Router, Request, Response } from "express";
import * as controller from "../controllers/leaderboard.controller";

const route: Router = Router();


route.get('/', controller.getLeaderboard);



export const leaderBoardRoute: Router = route;