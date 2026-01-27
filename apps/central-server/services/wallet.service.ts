import prisma from "@repo/db";
import { ServerError } from "./error.service";



export class WalletService{
    async getBalance(userId:string) {
        try {
            
        } catch (error) {
            throw new ServerError("Could not get balance, internal server error")
        }
    }
    async updateBalance(userId:string,amount:number){
        try {
            
        } catch (error) {
            throw new ServerError("Could not update balance, internal server error")
        }
    }
}