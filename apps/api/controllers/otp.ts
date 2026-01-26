import prisma from "@repo/db";
import redis from "../config/redis"; //just for otp , primary server redis 
import { Request,Response } from "express";
import resend from "../config/resend";
function generateOTP(){
    return Math.floor(100000 + Math.random() * 900000).toString();
} 

export const sendOTP = async (req:Request,res:Response) => {
    try {
        const {userEmail}= req.body
        if(!userEmail){
            return res.status(400).json({
                success:false,
                message:"Bad request, email not provided"
            })
        }
        const user = await prisma.users.findUnique({
            where:{email:userEmail}
        })
        if(!user){
            return res.status(404).json({
                success:false,
                message:"User not found"
            })
        }
        const otp = generateOTP();
        await redis.set(`otp:${userEmail}`,otp,"EX",300)

        await resend.emails.send({
            from:"onboarding@resend.dev",
            to:userEmail,
            subject:"Syndic OTP code",
            html: `<p>Your OTP is <b>${otp}</b>. It expires in 5 minutes.</p>`
        })

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully",
            data:otp
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"Could not send OTP, internal server error"
        })
    }
}

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { userEmail, otp } = req.body;
    if (!userEmail || !otp) {
      return res.status(400).json({
        success: false,
        message: "Bad request, email or OTP missing",
      });
    }

    const storedOTP = await redis.get(`otp:${userEmail}`);
    if (!storedOTP) {
      return res.status(404).json({
        success: false,
        message: "OTP expired or not found",
      });
    }

    if (storedOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    await redis.del(`otp:${userEmail}`);

    const updatedUser = await prisma.users.update({
      where: { email: userEmail },
      data: { isVerified: true }, 
    });

   return res.status(200).json({
     success: true,
     message: "OTP verified successfully",
     data: { email: updatedUser.email, isVerified: updatedUser.isVerified },
   });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Could not verify OTP, internal server error",
    });
  }
};
