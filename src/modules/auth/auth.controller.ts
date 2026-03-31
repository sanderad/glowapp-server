import { Request, Response } from "express";
import {
  controller,
  httpGet,
  httpPost,
  httpDelete,
} from "inversify-express-utils";
import { inject } from "inversify";
import { TYPES } from "../../shared/container/types";
import { AuthService } from "./auth.service";
import { validate } from "class-validator";
import { plainToClass } from "class-transformer";
import { RegisterClientDto } from "./dto/register-client.dto";
import { RegisterStylistDto } from "./dto/register-stylist.dto";
import { LoginDto } from "./dto/login.dto";
import { env } from "../../config/env";
import { authenticateJWT } from "./middlewares/authenticate-jwt.middleware";

@controller("/auth")
export class AuthController {
  constructor(@inject(TYPES.AuthService) private authService: AuthService) {}

  @httpPost("/register/client")
  public async registerClient(req: Request, res: Response) {
    try {
      // 1. Transformar body a DTO
      const dto = plainToClass(RegisterClientDto, req.body);

      // 2. Validar
      const errors = await validate(dto);
      if (errors.length > 0) {
        return res.status(400).json({
          errors: errors.map((e) => Object.values(e.constraints || {})),
        });
      }

      // 3. Llamar al servicio
      const result = await this.authService.registerClient(dto);

      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  @httpPost("/register/stylist")
  public async registerStylist(req: Request, res: Response) {
    try {
      const dto = plainToClass(RegisterStylistDto, req.body);

      // Validar (incluyendo los servicios anidados)
      const errors = await validate(dto);
      if (errors.length > 0) {
        // Truco para mostrar errores anidados de forma legible
        return res.status(400).json({ errors: errors });
      }

      const result = await this.authService.registerStylist(dto);

      res.cookie("token", result.token, {
        httpOnly: true,
        secure: env.nodeEnv === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  @httpPost("/login")
  public async login(req: Request, res: Response) {
    try {
      const dto = plainToClass(LoginDto, req.body);

      console.log("1. Petición de login recibida en el backend");
      const errors = await validate(dto);
      if (errors.length > 0) {
        return res.status(400).json({
          errors: errors.map((e) => Object.values(e.constraints || {})),
        });
      }
      console.log("2. A punto de buscar en la base de datos a:", dto.email);

      const result = await this.authService.login(dto);

      console.log("3. ¡La base de datos respondió!", result);

      res.cookie("token", result.token, {
        httpOnly: true,
        secure: env.nodeEnv === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      console.log("4. Token enviado en la respuesta");

      return res.json(result);
    } catch (error: any) {
      // Por seguridad, siempre devolvemos 401 (Unauthorized) en login fallido
      console.error("❌ Error catastrófico en el login:", error);
      return res.status(401).json({ error: error.message });
    }
  }

  @httpGet("/me", authenticateJWT)
  public async getMe(req: Request, res: Response) {
    try {
      const user = await this.authService.getMe(req.user!.id);
      return res.json(user);
    } catch (error: any) {
      return res.status(401).json({ error: error.message });
    }
  }

  @httpPost("/logout")
  public async logout(req: Request, res: Response) {
    res.clearCookie("token");
    return res.json({ message: "Logged out successfully" });
  }

  @httpDelete("/user/:id")
  public async deleteUser(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await this.authService.deleteUser(id);
      return res.json({ message: "Usuario eliminado exitosamente" });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
