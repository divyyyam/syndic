import { Request, Response } from "express";
import prisma from "@repo/db";
import { HttpStatus } from "../utils/http";

export class WalletController {
  update = async (req: Request, res: Response) => {
    try {
    } catch (error) {
      return res.status(HttpStatus.ServerError).json({
        success: false,
        error: (error as Error).message,
      });
    }
  };
  getBalance = async (req: Request, res: Response) => {
    try {
    } catch (error) {}
  };
}
