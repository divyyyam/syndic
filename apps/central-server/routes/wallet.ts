import express,{ Request,Response,NextFunction } from "express";
import { WalletController } from "../controllers/wallet";



const router = express.Router()
const wallet = new WalletController()











export default router