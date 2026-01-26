import express, { Request, Response, NextFunction } from "express";
import { addKYCInfo } from "../controllers/kyc.controller";
import { upload } from "../utils/cloudinary";

const kycRouter = express.Router();

// Routes for KYC operations
kycRouter.post("/add", upload.fields([
  { name: 'panImage', maxCount: 1 },
  { name: 'aadhaarImage', maxCount: 1 }
]), addKYCInfo);

// kycRouter.put("/update/:userId", upload.fields([
//   { name: 'panImage', maxCount: 1 },
//   { name: 'aadhaarImage', maxCount: 1 }
// ]), updateKYC);

export default kycRouter;
