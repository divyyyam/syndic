import { Request, Response } from 'express';
import prisma from '@repo/db';
import { uploadToCloudinary } from '../utils/cloudinary';
// Add new KYC information
export const addKYCInfo = async (req: Request, res: Response) => {
  try {
    const { userEmail, panNumber, aadhaarNumber } = req.body;
    
    // Check if required fields are present
    if (!userEmail || !panNumber || !aadhaarNumber) {
      return res.status(400).json({
        success: false,
        message: 'userId, panNumber, and aadhaarNumber are required'
      });
    }

 
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const panImageFile = files?.panImage?.[0];
    const aadhaarImageFile = files?.aadhaarImage?.[0];
    
    if (!panImageFile && !aadhaarImageFile) {
      return res.status(400).json({
        success: false,
        message: 'PAN image and Aadhaar image files are required'
      });
    }

    // Check if KYC already exists
    const existingKYC = await prisma.userKYC.findUnique({
      where: { userEmail:userEmail }
    });

    if (existingKYC) {
      return res.status(409).json({
        success: false,
        message: 'KYC already exists for this user'
      });
    }

    let panImageUrl = '';
    let aadhaarImageUrl = '';

    // Upload PAN image to Cloudinary
    if (panImageFile) {
      const panUploadResult = await uploadToCloudinary(
        panImageFile.buffer,
        `kyc/${userEmail}/pan`,
        `pan_${userEmail}_${Date.now()}`
      );
      panImageUrl = panUploadResult.url;
    }

    // Upload Aadhaar image to Cloudinary
    if (aadhaarImageFile) {
      const aadhaarUploadResult = await uploadToCloudinary(
        aadhaarImageFile.buffer,
        `kyc/${userEmail}/aadhaar`,
        `aadhaar_${userEmail}_${Date.now()}`
      );
      aadhaarImageUrl = aadhaarUploadResult.url;
    }

    // Create KYC record
    const kycData = await prisma.userKYC.create({
      data: {
        userEmail,
        panNumber,
        aadhaarNumber,
        panImageUrl,
        aadhaarImageUrl
      }
    });

    return res.status(201).json({
      success: true,
      message: 'KYC added successfully',
      data: kycData
    });

  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'PAN or Aadhaar number already exists'
      });
    }

    console.error('Error adding KYC:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update existing KYC information
// export const updateKYC = async (req: Request, res: Response) => {
//   try {
//     const { userId } = req.params;
//     const { panNumber, aadhaarNumber } = req.body;

//     // Check if KYC exists
//     const existingKYC = await prisma.userKYC.findUnique({
//       where: { userId }
//     });

//     if (!existingKYC) {
//       return res.status(404).json({
//         success: false,
//         message: 'KYC not found'
//       });
//     }

//     // Get uploaded files
//     const files = req.files as { [fieldname: string]: Express.Multer.File[] };
//     const panImageFile = files?.panImage?.[0];
//     const aadhaarImageFile = files?.aadhaarImage?.[0];

//     let updateData: any = {
//       ...(panNumber && { panNumber }),
//       ...(aadhaarNumber && { aadhaarNumber }),
//     };

//     // Upload new PAN image if provided
//     if (panImageFile) {
//       const panUploadResult = await uploadToCloudinary(
//         panImageFile.buffer,
//         `kyc/${userId}/pan`,
//         `pan_${userId}_${Date.now()}`
//       );
//       updateData.panImageUrl = panUploadResult.url;
//     }

//     // Upload new Aadhaar image if provided
//     if (aadhaarImageFile) {
//       const aadhaarUploadResult = await uploadToCloudinary(
//         aadhaarImageFile.buffer,
//         `kyc/${userId}/aadhaar`,
//         `aadhaar_${userId}_${Date.now()}`
//       );
//       updateData.aadhaarImageUrl = aadhaarUploadResult.url;
//     }

//     // Update KYC record
//     const updatedKYC = await prisma.userKYC.update({
//       where: { userId },
//       data: updateData
//     });

//     return res.status(200).json({
//       success: true,
//       message: 'KYC updated successfully',
//       data: updatedKYC
//     });

//   } catch (error: any) {
//     if (error.code === 'P2002') {
//       return res.status(409).json({
//         success: false,
//         message: 'PAN or Aadhaar number already exists'
//       });
//     }

//     console.error('Error updating KYC:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };