import dotenv from "dotenv";
dotenv.config();
import express, { Express, Request, Response} from "express";
import cors from "cors";
import { connect } from "./configs/database";
import mainV1Route from "./api/v1/routes/index.route";


const app: Express= express();
connect();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port: string | number = process.env.PORT!;

mainV1Route(app);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
})
