import { Request,Response,NextFunction } from "express";
import { HttpStatus } from "../utils/http";
import {verifyAccessToken} from "@repo/utils"

 
export const authMiddleware = async (req:Request,res:Response,next:NextFunction) => {
    const token = req.cookies.access_token
    try {
        const decoded =  verifyAccessToken(token)  
        if(!decoded){
            return res.status(HttpStatus.Unauthorized).json({
                success:false,
                message:"Unauthorized user"
            })
        }
        const userId = decoded as Request["userId"]
        console.log(userId);
        next()
    } catch (error) {
        return res.status(HttpStatus.ServerError).json({
            success:false,
            message:"User authentication failed, Internal server error"
        })
    } 
}