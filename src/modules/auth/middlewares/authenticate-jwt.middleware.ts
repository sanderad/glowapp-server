import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../../config/env";
import { AuthUser } from "../auth.types";

export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "No authentication token found" });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret || "secret") as AuthUser;

    // Attach user payload to request object
    req.user = payload;

    // Refresh Token
    const { iat, exp, ...userPayload } = payload;
    const newToken = jwt.sign(userPayload, env.jwtSecret || "secret", {
      expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as any,
    });

    res.cookie("token", newToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    next();
  } catch (err) {
    res.clearCookie("token");
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};
