import {Express, Request, Response} from "express";
import { authRoute } from "./auth.route";

const mainV1Route = (app: Express): void => {
    const version: string = "/api/v1";

    app.use(version + '/auth', authRoute);
}

export default mainV1Route;