import { Container } from "inversify";
import { TYPES } from "./types";
import { AuthService } from "../../modules/auth/auth.service";
import { AuthController } from "../../modules/auth/auth.controller";
import { UploadController } from "../../modules/uploads/upload.controller";
import { StylistService } from "../../modules/stylists/stylist.service";
import { StylistController } from "../../modules/stylists/stylist.controller";
import { ChatService } from "../../modules/chat/chat.service";
import { ChatController } from "../../modules/chat/chat.controller";
import { UsersService } from "../../modules/users/users.service";
import { UsersController } from "../../modules/users/users.controller";
import { AdminService } from "../../modules/admin/admin.service";
import "../../modules/admin/admin.controller";

const container = new Container();

container
  .bind<UploadController>(TYPES.UploadController)
  .to(UploadController)
  .inSingletonScope();
container
  .bind<AuthService>(TYPES.AuthService)
  .to(AuthService)
  .inSingletonScope();
container
  .bind<AuthController>(TYPES.AuthController)
  .to(AuthController)
  .inSingletonScope();
container
  .bind<StylistService>(TYPES.StylistService)
  .to(StylistService)
  .inSingletonScope();
container
  .bind<StylistController>(TYPES.StylistController)
  .to(StylistController)
  .inSingletonScope();
container
  .bind<ChatService>(TYPES.ChatService)
  .to(ChatService)
  .inSingletonScope();
container
  .bind<ChatController>(TYPES.ChatController)
  .to(ChatController)
  .inSingletonScope();
container
  .bind<UsersService>(TYPES.UsersService)
  .to(UsersService)
  .inSingletonScope();
container
  .bind<UsersController>(TYPES.UsersController)
  .to(UsersController)
  .inSingletonScope();
container
  .bind<AdminService>(TYPES.AdminService)
  .to(AdminService)
  .inSingletonScope();
// AdminController no se bindea como scope, solo se carga (Inversify lo lee del decorador importado arriba)

export { container };
