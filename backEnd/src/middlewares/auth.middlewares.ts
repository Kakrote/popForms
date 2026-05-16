import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";
import { log } from "node:console";

type JwtUser = {
  id: string;
  role: "USER" | "ADMIN";
};

type AuthenticatedRequest = Request & {
  user?: JwtUser;
};

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    logger.warn("Unauthorized access attempt to a protected route without token");
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const token = authHeader.split(" ")[1];

  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JwtUser;

    req.user = decoded;

    next();

  } catch {

    return res.status(401).json({
      message: "Invalid token",
    });
  }
};

export const authorizeRoles = (...allowedRoles: Array<JwtUser["role"]>) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn("Unauthorized role access attempt to a protected route");
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    next();
  };
};