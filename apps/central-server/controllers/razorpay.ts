import express from "express";
import { Request, Response } from "express";
import razorpay from "../services/razorpay.config";
import crypto from "crypto";

export const createPayment = async (req: Request, res: Response) => {
  const { amount } = req.body;
  const options = {
    amount: amount * 100,
    currency: "INR",
    receipt: `receipt_order${Date.now()}`,
  };
  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      message: "Could not complete payment, internal server error",
    });
  }
};



export const verifyPayment = async (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto.createHmac('sha256',process.env.RAZORPAY_KEY_SECRET as string).update(body.toString()).digest('hex')
  if (expectedSignature === razorpay_signature) {
    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
    });
  } else {
    res.status(400).json({
      success: false,
      message: "Payment verification failed",
    });
  }
  try {
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      message: "Could not verify payment, internal server error",
    });
  }
};
