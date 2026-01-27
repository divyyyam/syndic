import { Request,Response } from "express";
import { HttpStatus } from "../utils/http";


export class RazorpayController{
    newtransaction = async (req:Request,res:Response) => {
        try {
            
        } catch (error) {
            return res.status(HttpStatus.ServerError).json({
                success:false,
                error:(error as Error).message
            })
        }
    }
}