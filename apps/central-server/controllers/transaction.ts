import { Request, Response } from "express";
import prisma from "@repo/db";
import { HttpStatus } from "../utils/http";

export class TransactionController {
  createF2F = async (req: Request, res: Response) => {
    try {
    } catch (error) {
         return res.status(HttpStatus.ServerError).json({
            success:false,
            error:(error as Error).message
        })
    }
  };
  //creates Fiat to crypto transactions
  createF2C = async (req: Request, res: Response) => {
    try {
    } catch (error) {
        return res.status(HttpStatus.ServerError).json({
            success:false,
            error:(error as Error).message
        })
    }
  };

  //gets all user transactions
  fetch = async (req: Request, res: Response) => {
    try {
    } catch (error) {
      return res.status(HttpStatus.ServerError).json({
        success: false,
        error: (error as Error).message,
      });
    }
  };

  createC2F = async (req: Request, res: Response) => {
    try {
    } catch (error) {
      return res.status(HttpStatus.ServerError).json({
        success: false,
        error: (error as Error).message,
      });
    }
  };
}
