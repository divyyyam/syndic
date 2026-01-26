import express, { Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth";
import profileRouter from "./routes/profile";
import pinRouter from "./routes/pin";
import otpRouter from "./routes/otp";
import verificationRouter from "./routes/verifyUser";
import getUserRouter from "./routes/getAllUsers";
import kycRouter from "./routes/kyc.router";

const app = express();
const port = 4000;

app.use(express.json());
app.use(cors({
  origin: ["http://localhost:3000","http://localhost:3001","http://localhost:3002"], 
  credentials: true
}))
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//APIs
app.use("/api/v1/auth", authRouter); //auth
app.use("/api/v1/user",profileRouter) //profile
app.use("/api/v1/pin",pinRouter) //pin
app.use('/api/v1/otp',otpRouter)//otp  
app.use('/api/v1/verification',verificationRouter)//user verification, use only once
app.use("/api/v1/all-users",getUserRouter); //users search
app.use("/api/v1/kyc", kycRouter); //kyc operations


app.get("/health", async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "API workin",
  });
});


declare global{
  namespace Express{
    interface Request{
      userId?:string,
      
    }
  }
}
app.listen(port, () => {
  console.log("Server started on :", port);
});
