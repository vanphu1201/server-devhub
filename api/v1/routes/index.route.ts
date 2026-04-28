import {Express, Request, Response} from "express";
import { authRoute } from "./auth.route";
import { usersRoute } from "./users.route";

const mainV1Route = (app: Express): void => {
    const version: string = "/api/v1";

    app.use(version + '/auth', authRoute);
    app.use(version + '/users', usersRoute);

}

export default mainV1Route;