import { Request,Response,NextFunction } from "express";
import { HttpStatus } from "../utils/Http";



export const authMiddleware = async (req:Request,res:Response,next:NextFunction) => {
    const userId = req.userId
    try {
        
    } catch (error) {
        return res.status(HttpStatus.ServerError).json({
            success:false,
            message:"User authentication failed, Internal server error"
        })
    }
}