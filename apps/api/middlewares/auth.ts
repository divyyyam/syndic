import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@repo/utils";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email?: string;
    firstName?: string;
    lastName?: string; 
  };
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
   
    const token =
      req.cookies?.accessToken ||
      req.headers.authorization?.replace("Bearer ", "");
      
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    // Verify JWT
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

 
    req.user = decoded as AuthenticatedRequest["user"];

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};
