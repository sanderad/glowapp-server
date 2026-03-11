import { Request, Response } from "express";
import { controller, httpPut } from "inversify-express-utils";
import { inject } from "inversify";
import { TYPES } from "../../shared/container/types";
import { UsersService } from "./users.service";
import { authenticateJWT } from "../auth/middlewares/authenticate-jwt.middleware";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import { UpdateUserDto } from "./dto/update-user.dto";

@controller("/users")
export class UsersController {
  constructor(@inject(TYPES.UsersService) private usersService: UsersService) {}

  @httpPut("/me", authenticateJWT)
  public async updateMe(req: Request, res: Response) {
    try {
      const dto = plainToClass(UpdateUserDto, req.body);

      const errors = await validate(dto);
      if (errors.length > 0) {
        return res.status(400).json({
          errors: errors.map((e) => Object.values(e.constraints || {})),
        });
      }

      const updatedUser = await this.usersService.updateMe(req.user!.id, dto);
      return res.json(updatedUser);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
