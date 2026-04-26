import {Express, Request, Response} from "express";

const mainV1Route = (app: Express): void => {
    const version: string = "/api/v1";

    app.get(version + '/', (req: Request, res: Response) => {
        res.json({
            code: 200,
            message: "thanh cong!"
        });
    });
}

export default mainV1Route;