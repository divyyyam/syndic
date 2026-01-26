// import prisma from "@repo/db";
// import { Request,Response } from "express";

// export const getAllUsers = async (req:Request,res:Response) => {
//     try {
//         const { search } = req.query;
//         const users = await prisma.users.findMany({
//             select: {
//                 id: true,
//                 email: true,
//                 firstName: true,
//                 lastName: true,
//                 isVerified: true,
//                 createdAt: true,
//             },
//             where: search ? {
//                 OR: [
//                     {
//                         email: {
//                             contains: search as string,
//                             mode: 'insensitive'
//                         }
//                     },
//                     {
//                         firstName: {
//                             contains: search as string,
//                             mode: 'insensitive'
//                         }
//                     },
//                     {
//                         lastName: {
//                             contains: search as string,
//                             mode: 'insensitive'
//                         }
//                     }
//                 ]
//             } : {},
//             orderBy: {
//                 email: 'asc'
//             }
//         });

//         return res.status(200).json({
//             success: true,
//             message: "Users retrieved successfully",
//             users: users,
//             count: users.length
//         });

//     } catch (error) {
//         console.log(error)
//         return res.status(500).json({
//             success:false,
//             message:"Couldn't get users , Internal server error"
//         })
//     }
// }