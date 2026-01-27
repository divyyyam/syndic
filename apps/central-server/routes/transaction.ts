import { TransactionController } from "../controllers/transaction";
import express,{Request,Response,NextFunction} from "express"


const router = express.Router()
const transaction = new TransactionController()




export default router;