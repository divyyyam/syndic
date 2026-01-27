import express, { Request,Response,NextFunction } from "express";
import { RazorpayController } from "../controllers/razorpay";



const router = express.Router()
const razorpay = new RazorpayController()







export default router