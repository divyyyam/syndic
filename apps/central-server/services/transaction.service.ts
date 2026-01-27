import prisma from "@repo/db";
import { ServerError } from "./error.service";



export class TransactionService{
    async create(userId:string){
        try {
            
        } catch (error) {
            throw new ServerError("Could not create transaction, internal server error")
        }
    }
}