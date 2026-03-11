import { Request, Response } from "express";
import {
  controller,
  httpGet,
  httpPost,
  httpPut,
} from "inversify-express-utils";
import { inject } from "inversify";
import { TYPES } from "../../shared/container/types";
import { ChatService } from "./chat.service";
import { authenticateJWT } from "../auth/middlewares/authenticate-jwt.middleware";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { env } from "../../config/env";
import { AppDataSource } from "../../config/data-source";
import { StylistProfile } from "../stylists/entities/stylist-profile.entity";
import { UserRole } from "../users/entities/user.entity";

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "glowapp_uploads",
    // Solo permitimos estos formatos seguros.
    // ¡IMPORTANTE: No ponemos format ni public_id custom para evitar el error 400!
    allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
  } as any,
});
const upload = multer({ storage });

@controller("/chats")
export class ChatController {
  constructor(@inject(TYPES.ChatService) private chatService: ChatService) {}

  @httpGet("/", authenticateJWT)
  public async getUserConversations(req: Request, res: Response) {
    try {
      const user = req.user!;

      if (user.role === UserRole.STYLIST) {
        const profile = await AppDataSource.manager.findOne(StylistProfile, {
          where: { user: { id: user.id } },
          select: ["id", "subscriptionEndsAt", "isVisible"],
        });

        if (
          profile &&
          (profile.subscriptionEndsAt < new Date() || !profile.isVisible)
        ) {
          return res.json({ noChatsBecauseOfExpiredProfile: true });
        }
      }

      const chats = await this.chatService.getUserConversations(user.id);
      return res.json(chats);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  @httpGet("/:chatId/messages", authenticateJWT)
  public async getMessages(req: Request, res: Response) {
    try {
      const chatId = parseInt(req.params.chatId);
      const messages = await this.chatService.getMessages(chatId);
      return res.json(messages);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  @httpPost("/:chatId/messages", authenticateJWT)
  public async createMessage(req: Request, res: Response) {
    try {
      const chatId = parseInt(req.params.chatId);
      const senderId = req.user!.id;
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({ error: "El texto es obligatorio" });
      }

      const message = await this.chatService.createMessage(
        chatId,
        senderId,
        text
      );
      return res.status(201).json(message);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // Custom endpoint to initiate a chat given a user ID (useful when clicking "Send message" on a profile)
  @httpPost("/init/:recipientId", authenticateJWT)
  public async initChat(req: Request, res: Response) {
    try {
      const senderId = req.user!.id;
      const recipientId = parseInt(req.params.recipientId);

      const conversation = await this.chatService.getOrCreateConversation(
        senderId,
        recipientId
      );
      return res.status(200).json({ chatId: conversation.id });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // Upload an image for a chat message
  @httpPost("/:chatId/upload", authenticateJWT, upload.single("image"))
  public async uploadImage(req: Request, res: Response) {
    try {
      if (!req.file) throw new Error("No image uploaded");

      return res.json({ imageUrl: req.file.path });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
