import { Request, Response } from "express";
import {
  controller,
  httpGet,
  httpPut,
  httpPost,
} from "inversify-express-utils";
import { inject } from "inversify";
import { TYPES } from "../../shared/container/types";
import { StylistService } from "./stylist.service";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import { UpdatePortfolioStylistDto } from "./dto/update-portfolio-stylist.dto";
import { UpdateStylistProfileDto } from "./dto/update-stylist-profile.dto";
import { CreateReviewDto } from "./dto/create-review.dto";
import { authenticateJWT } from "../auth/middlewares/authenticate-jwt.middleware";

@controller("/stylists")
export class StylistController {
  constructor(
    @inject(TYPES.StylistService) private stylistService: StylistService
  ) {}

  // GET /stylists?category=Uñas&search=Ana
  @httpGet("/", authenticateJWT)
  public async getAll(req: Request, res: Response) {
    try {
      const { search, category } = req.query;
      const user = req.user;

      const stylists = await this.stylistService.findAll({
        search: search as string,
        category: category as string,
      });

      return res.json(stylists);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // GET /stylists/favorites/me
  @httpGet("/favorites/me", authenticateJWT)
  public async getFavorites(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const favorites = await this.stylistService.getFavorites(userId);
      return res.json(favorites);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // GET /stylists/detailed/5
  @httpGet("/detailed/:id", authenticateJWT)
  public async getOne(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user?.id; // Usamos ?. por si acaso (aunque hay middleware)
      const stylist = await this.stylistService.findOneDetailed(id, userId);
      return res.json(stylist);
    } catch (error: any) {
      return res.status(404).json({ error: error.message });
    }
  }

  // PUT /stylists/me (Actualizar Datos Profesionales)
  @httpPut("/me", authenticateJWT)
  public async updateMe(req: Request, res: Response) {
    try {
      const dto = plainToClass(UpdateStylistProfileDto, req.body);

      const errors = await validate(dto);
      if (errors.length > 0) {
        return res.status(400).json({
          errors: errors.map((e) => Object.values(e.constraints || {})),
        });
      }

      const stylist = await this.stylistService.updateMyProfile(
        req.user!.id,
        dto
      );
      return res.json(stylist);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // Legacy (Mantenido por retrocompatibilidad)
  @httpPut("/profile/portfolio/:stylistId", authenticateJWT)
  public async updatePortfolio(req: Request, res: Response) {
    try {
      const { stylistId } = req.params;
      const dto = plainToClass(UpdatePortfolioStylistDto, req.body);
      const stylist = await this.stylistService.updatePortfolio(
        parseInt(stylistId),
        dto
      );
      return res.json(stylist);
    } catch (error: any) {
      return res.status(404).json({ error: error.message });
    }
  }

  @httpPost("/:stylistId/reviews", authenticateJWT)
  public async createReview(req: Request, res: Response) {
    try {
      const stylistId = parseInt(req.params.stylistId);
      const userId = req.user!.id; // Obtenemos el ID del usuario del token

      const dto = plainToClass(CreateReviewDto, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        return res.status(400).json({
          errors: errors.map((e) => Object.values(e.constraints || {})),
        });
      }

      const review = await this.stylistService.createReview(
        stylistId,
        userId,
        dto
      );
      return res.status(201).json(review);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  @httpPost("/:stylistId/favorite", authenticateJWT)
  public async toggleFavorite(req: Request, res: Response) {
    try {
      const stylistId = parseInt(req.params.stylistId);
      const userId = req.user!.id;

      const result = await this.stylistService.toggleFavorite(
        userId,
        stylistId
      );
      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
