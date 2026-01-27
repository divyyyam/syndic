import prisma from "@repo/db";
import { ServerError } from "./error.service";
 

export class UserService{
    async findUser(userId:string){
        try {
            
        } catch (error) {
            throw new ServerError("Could not find user, internal server error")
        }
    }
    async userEmail(email:string){
        try {
            
        } catch (error) {
            throw new ServerError("Could not find user, internal server error")
        }
    }
}