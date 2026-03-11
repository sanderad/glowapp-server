import { Request, Response } from "express";
import { controller, httpGet, httpPost } from "inversify-express-utils";
import { inject } from "inversify";
import { TYPES } from "../../shared/container/types";
import { AdminService } from "./admin.service";
import { authenticateJWT } from "../auth/middlewares/authenticate-jwt.middleware";
import { requireAdmin } from "../auth/middlewares/require-admin.middleware";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import { RenewSubscriptionDto } from "./dto/renew-subscription.dto";

@controller("/admin", authenticateJWT, requireAdmin)
export class AdminController {
  constructor(@inject(TYPES.AdminService) private adminService: AdminService) {}

  @httpGet("/stylists")
  public async getStylists(req: Request, res: Response) {
    try {
      const stylists = await this.adminService.getAllStylists();
      return res.json(stylists);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  @httpPost("/stylists/:id/renew")
  public async renewSubscription(req: Request, res: Response) {
    try {
      const dto = plainToClass(RenewSubscriptionDto, req.body);

      const errors = await validate(dto);
      if (errors.length > 0) {
        return res.status(400).json({
          errors: errors.map((e) => Object.values(e.constraints || {})),
        });
      }

      const stylistId = parseInt(req.params.id);
      if (isNaN(stylistId)) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      const result = await this.adminService.renewSubscription(stylistId, dto);
      return res.json({
        message: "Suscripción renovada exitosamente",
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
