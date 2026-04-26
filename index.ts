import dotenv from "dotenv";
import express, { Express, Request, Response} from "express";
import { connect } from "./configs/database";
import mainV1Route from "./api/v1/routes/index.route";


const app: Express= express();
dotenv.config();
connect();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port: string | number = process.env.PORT!;

mainV1Route(app);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
})
