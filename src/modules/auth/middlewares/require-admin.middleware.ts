import { Request, Response, NextFunction } from "express";
import { UserRole } from "../../users/entities/user.entity"; // O adaptado según donde tengas el Enum, lo adaptaremos

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ message: "No authentication token found" });
  }

  // Comprobar rol de administrador
  console.log(req.user);
  if (req.user.role !== "ADMIN") {
    // "ADMIN" from UserRole enum
    return res
      .status(403)
      .json({ message: "Requiere privilegios de Administrador" });
  }

  next();
};
