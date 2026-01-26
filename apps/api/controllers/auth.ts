import express, { Request, Response } from "express";
import prisma from "@repo/db";
import { newUser, loginSchema } from "@repo/zod";
import {
  hashPassword,
  verifyPassword,
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashRefreshToken,
  rotateTokens,
} from "@repo/utils";

export const registerUser = async (req: Request, res: Response) => {
  try {
    const validation = newUser.safeParse(req.body);

    if (!validation.success) {
      return res
        .status(400)
        .json({ success: false, message: "Validation failed" });
    }

    const { firstName, lastName, email, password } = validation.data;

    const existingUser = await prisma.users.findUnique({ where: { email } });

    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: "User already exists" });
    }

    const hashedPwd = await hashPassword(password);
 
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          firstName: firstName,
          lastName: lastName,
          email: email,
          password: hashedPwd,
          isVerified: false,
        },
      });

    
      await tx.syndicWallet.create({
        data: {
          userEmail: email,
          totalAED: 0,
          totalINR: 0,
          totalUSD: 0,
        },
      });

      return user;
    });

    // const checkUser = await prisma.users.findUnique({
    //   where: { id: result.id },
    //   select: {
    //     id: true,
    //     firstName: true,
    //     lastName: true,
    //     email: true,
    //     isVerified: true,
    //     createdAt: true,
    //     updatedAt: true,
    //   },
    // });

    if (!checkUser) {
      return res
        .status(500)
        .json({ success: false, message: "Registration Process Failed" });
    } else {
      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        user: checkUser,
      });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: (error as Error).message });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      return res
        .status(400)
        .json({ success: false, message: "validation failed" });
    }

    const { email, password } = validation.data;

    // const user = await prisma.users.findUnique({ where: { email } });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not registered" });
    }

    const isValidPwd = await verifyPassword(password, user.password);

    if (!isValidPwd) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const accessTokenPayload = {
      userId: user.id,
    };

    const refreshTokenPayload = {
      userId: user.id,
    };

    const accessToken = createAccessToken(
      accessTokenPayload,
      process.env.ACCESS_TOKEN_SECRET!,
      process.env.ACCESS_TOKEN_EXPIRY!
    );

    const refreshToken = createRefreshToken(
      refreshTokenPayload,
      process.env.REFRESH_TOKEN_SECRET!,
      process.env.REFRESH_TOKEN_EXPIRY!
    );

    const hashedRefreshToken = await hashRefreshToken(refreshToken);

    await prisma.users.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production"
          ? ("none" as const)
          : ("lax" as const),
      path: "/",
    };

    console.log("accesstoken", accessToken);
    console.log("refreshtoken", refreshToken);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        success: true,
        message: "User logged in successfully",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: (error as Error).message });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Access token required" });
    }

    const decoded = verifyAccessToken(token, process.env.ACCESS_TOKEN_SECRET!);

    if (!decoded) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired token" });
    }

    const { userId } = decoded as any;

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "User info fetched successfully",
      user: user,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: (error as Error).message });
  }
};

export const refreshTokens = async (req: Request, res: Response) => {
  try {
    const normalRefreshToken = req.cookies?.refreshToken;

    if (!normalRefreshToken) {
      return res
        .status(401)
        .json({ success: false, message: "Refresh token required" });
    }

    const decoded = verifyRefreshToken(
      normalRefreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    );

    if (!decoded) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired refresh token" });
    }

    const { userId } = decoded as any;

    const user = await prisma.users.findUnique({ where: { id: userId } });

    if (!user || !user.refreshToken) {
      return res.status(401).json({
        success: false,
        message: "User not found or no refresh token stored",
      });
    }

    const isValidRT = await verifyPassword(
      normalRefreshToken,
      user.refreshToken
    );

    if (!isValidRT) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid refresh token" });
    }

    const newTokens = rotateTokens(
      {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      { userId: user.id },
      process.env.ACCESS_TOKEN_SECRET!,
      process.env.REFRESH_TOKEN_SECRET!
    );

    const hashedNewRefreshToken = await hashRefreshToken(
      newTokens.refreshToken
    );

    await prisma.users.update({
      where: { id: userId },
      data: { refreshToken: hashedNewRefreshToken },
    });

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production"
          ? ("none" as const)
          : ("lax" as const),
      path: "/",
    };

    return res
      .cookie("accessToken", newTokens.accessToken, options)
      .cookie("refreshToken", newTokens.refreshToken, options)
      .json({ success: true, message: "Tokens refreshed successfully" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: (error as Error).message });
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      const decoded = verifyRefreshToken(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET!
      );

      if (decoded) {
        const { userId } = decoded as any;
        await prisma.users.update({
          where: { id: userId },
          data: { refreshToken: null },
        });
      }
    }

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production"
          ? ("none" as const)
          : ("lax" as const),
      path: "/",
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json({
        success: true,
        message: "Logged out successfully",
      });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: (error as Error).message });
  }
};
