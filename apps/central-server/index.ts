import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";

const app = express();
const port = 4001;
dotenv.config();
app.use(express.json());

declare global {
  namespace Express {
    interface Request {
        userId?:string
    }
  }
}

app.listen(port, () => {
  console.log("Main api running on :", port);
});
