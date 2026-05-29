import {Express, Request, Response} from "express";
import { authRoute } from "./auth.route";
import { usersRoute } from "./users.route";
import { leaderBoardRoute } from "./leaderboard.route";
import { postsRoute } from "./posts.route";
import { blogRoute } from "./blog.route";
import { productsRoute } from "./products.route";
import { ticketsRoute } from "./tickets.route";

const mainV1Route = (app: Express): void => {
    const version: string = "/api/v1";

    app.use(version + '/auth', authRoute);
    app.use(version + '/users', usersRoute);
    app.use(version + '/leaderboard', leaderBoardRoute);
    app.use(version + '/posts', postsRoute);
    app.use(version + '/blog', blogRoute);
    app.use(version + '/products', productsRoute);
    app.use(version + '/tickets', ticketsRoute);
}

export default mainV1Route;