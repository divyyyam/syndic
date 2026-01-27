import { HttpStatus } from "../utils/http"
export class BadRequest extends Error{
    statusCode:number
    constructor(message:string){
        super(message)
        this.statusCode = HttpStatus.BadRequest
        this.name = "BadRequest"
    }
}

export class NotFound extends Error{
     statusCode:number
    constructor(message:string){
        super(message)
        this.statusCode = HttpStatus.NotFound
        this.name = "Not found"
    }
}
export class Unauthorized extends Error{
     statusCode:number
    constructor(message:string){
        super(message)
        this.statusCode = HttpStatus.Unauthorized
        this.name = "Unauthorized"
    }
}
 export class ServerError extends Error{
     statusCode:number
    constructor(message:string){
        super(message)
        this.statusCode = HttpStatus.ServerError
        this.name = "Server error"
    }
}