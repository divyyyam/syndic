import { Request,Response } from "express";
import { HttpStatus } from "../utils/http";
import { BadRequest } from "../services/error.service";


export class RazorpayController{
    create = async (req:Request,res:Response) => {
        try {
            
        } catch (error) {
            return res.status(HttpStatus.ServerError).json({
                success:false,
                error:(error as Error).message
            })
        }
    }
    alltransactions = async (req:Request,res:Response) => {
        try {
            const transactionId = req.body;
            if(!transactionId){
                throw new BadRequest("Transaction Id not found")
            }
            



        } catch (error) {
            return res.status(HttpStatus.ServerError).json({
                success:false,
                message:(error as Error).message
            })
        }
    }
}