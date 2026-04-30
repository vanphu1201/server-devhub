import {Express, Request, Response} from "express";
import { authRoute } from "./auth.route";
import { usersRoute } from "./users.route";
import { leaderBoardRoute } from "./leaderboard.route";

const mainV1Route = (app: Express): void => {
    const version: string = "/api/v1";

    app.use(version + '/auth', authRoute);
    app.use(version + '/users', usersRoute);
    app.use(version + '/leaderboard', leaderBoardRoute);

}

export default mainV1Route;