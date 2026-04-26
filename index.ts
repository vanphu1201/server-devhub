import dotenv from "dotenv";
import express, { Express, Request, Response} from "express";
import { connect } from "./configs/database";
import mainV1Route from "./api/v1/routes";


const app: Express= express();
dotenv.config();
connect();

const port: string | number = process.env.PORT!;

mainV1Route(app);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
})
