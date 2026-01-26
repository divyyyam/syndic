import prisma from "@repo/db";
import { verifyAccessToken } from "@repo/utils";
import { Request, Response } from "express";
import { setupProfileSchema } from "@repo/zod";

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET as string;

export const setupProfile = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "No auth token found, bad request",
      });
    }
    const decoded = verifyAccessToken(token, accessTokenSecret) as any;
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Token invalid or expired",
      });
    }
    const userId = decoded.id || decoded.userId;
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const validation = setupProfileSchema.safeParse(req.body)
    if(!validation.success){
      return res.status(400).json({
        success:false,
        message:"Validation failed"
      })
    }
    const {phoneNumber,address,country} = validation.data;
    const userProfile = await prisma.userProfile.create({
      data:{
        phoneNumber:phoneNumber,
        address:address,
        country:country,
        userID:userId
      }
    })
    return res.status(201).json({
      success:true,
      message:"User onboarding completed",
      data:userProfile
    })
  } catch {
    return res.status(401).json({
      success: false,
      message: "Token invalid or expired",
    });
  }
};

 

export const getUserProfileData = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "No auth token found, bad request",
      });
    }
    const decoded = verifyAccessToken(token, accessTokenSecret) as any;
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Token invalid or expired",
      });
    }
    const userId = decoded.id || decoded.userId;
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const userData = await prisma.userProfile.findUnique({
      where: { userID: userId },
      select: {
        phoneNumber: true,
        country: true,
        address: true,
         
      },
    });
    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User data not found",
      });
    }
    return res.status(201).json({
      success: true,
      message: "User data fetched successfully",
      data: userData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Couldn't get data , internal server error",
    });
  }
};



