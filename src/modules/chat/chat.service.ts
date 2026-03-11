import { injectable } from "inversify";
import { AppDataSource } from "../../config/data-source";
import { Conversation } from "./entities/conversation.entity";
import { Message } from "./entities/message.entity";
import { User, UserRole } from "../users/entities/user.entity";
import { StylistProfile } from "../stylists/entities/stylist-profile.entity";

@injectable()
export class ChatService {
  private conversationRepo = AppDataSource.getRepository(Conversation);
  private messageRepo = AppDataSource.getRepository(Message);
  private userRepo = AppDataSource.getRepository(User);

  // 1. Get all conversations for a user
  public async getUserConversations(userId: number) {
    // Buscar todas las conversaciones donde el usuario sea participante 1 o 2
    const conversations = await this.conversationRepo.find({
      where: [
        { participant1: { id: userId } },
        { participant2: { id: userId } },
      ],
      relations: [
        "participant1",
        "participant2",
        "messages",
        "messages.sender",
      ],
      order: {
        updatedAt: "DESC", // Ordenar por actividad reciente
      },
    });

    // 2. Filtrar conversaciones donde el estilista involucrado tenga suscripción expirada
    const validConversations = [];
    const now = new Date();

    for (const conv of conversations) {
      // Find the stylist participant (if any)
      const stylistParticipant =
        conv.participant1.role === UserRole.STYLIST
          ? conv.participant1
          : conv.participant2.role === UserRole.STYLIST
          ? conv.participant2
          : null;

      let isValid = true;

      // If one of the participants is a stylist, check their subscription
      if (stylistParticipant) {
        const profile = await AppDataSource.manager.findOne(StylistProfile, {
          where: { user: { id: stylistParticipant.id } },
          select: ["id", "subscriptionEndsAt", "isVisible"],
        });

        // If the stylist does not exist or their subscription has expired, it's invalid
        if (
          !profile ||
          profile.subscriptionEndsAt < now ||
          !profile.isVisible
        ) {
          isValid = false;
        }
      }

      if (isValid) {
        validConversations.push(conv);
      }
    }

    // 3. Mapear al DTO esperado por el frontend
    return validConversations.map((conv) => {
      // Identificar quién es el "otro" usuario
      const otherUser =
        conv.participant1.id === userId ? conv.participant2 : conv.participant1;

      // Obtener el último mensaje
      // Aseguramos de que están ordenados cronológicamente
      const sortedMessages = conv.messages.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );
      const lastMessage =
        sortedMessages.length > 0
          ? sortedMessages[sortedMessages.length - 1]
          : null;

      // Contar mensajes no leídos (donde isRead = false y el sender no es el usuario actual)
      const unreadCount = conv.messages.filter(
        (m) => !m.isRead && m.sender?.id !== userId
      ).length;

      return {
        id: conv.id,
        user: {
          id: otherUser.id,
          name: otherUser.fullName,
          photo: otherUser.photoUrl, // asumiendo que el frontend lo mapea así
        },
        lastMessage: lastMessage ? lastMessage.text : "",
        lastSenderId:
          lastMessage && lastMessage.sender ? lastMessage.sender.id : null,
        timestamp: lastMessage ? lastMessage.createdAt : conv.updatedAt,
        unreadCount,
      };
    });
  }

  // 2. Get messages for a specific chat
  public async getMessages(chatId: number) {
    // Traemos los mensajes ordenados de más antiguo a más nuevo
    const messages = await this.messageRepo.find({
      where: { conversation: { id: chatId } },
      relations: ["sender"],
      order: {
        createdAt: "ASC",
      },
    });

    return messages.map((m) => ({
      id: m.id,
      text: m.text || "",
      imageUrl: m.imageUrl || null,
      senderId: m.sender.id,
      createdAt: m.createdAt,
      isRead: m.isRead,
    }));
  }

  // 3. Create a message
  public async createMessage(
    chatId: number,
    senderId: number,
    text?: string,
    imageUrl?: string
  ) {
    if (!text && !imageUrl) {
      throw new Error("El mensaje debe contener texto o una imagen");
    }

    const conversation = await this.conversationRepo.findOne({
      where: { id: chatId },
    });

    if (!conversation) {
      throw new Error("Conversación no encontrada");
    }

    const sender = await this.userRepo.findOneBy({ id: senderId });
    if (!sender) {
      throw new Error("Usuario no encontrado");
    }

    const message = this.messageRepo.create({
      text: text || "",
      imageUrl,
      conversation,
      sender,
    });

    await this.messageRepo.save(message);

    // Actualizar el updatedAt de la conversación para que suba en la lista
    conversation.updatedAt = new Date();
    await this.conversationRepo.save(conversation);

    return {
      id: message.id,
      text: message.text,
      imageUrl: message.imageUrl,
      senderId: message.sender.id,
      createdAt: message.createdAt,
      isRead: message.isRead,
    };
  }

  // 4. Mark as read
  // Marca como leídos los mensajes que NO envió este usuario.
  public async markAsRead(chatId: number, userId: number) {
    const messages = await this.messageRepo.find({
      where: {
        conversation: { id: chatId },
        isRead: false,
      },
      relations: ["sender"],
    });

    // Filtramos los que envió el *otro*
    const messagesToUpdate = messages.filter((m) => m.sender.id !== userId);

    if (messagesToUpdate.length > 0) {
      messagesToUpdate.forEach((m) => (m.isRead = true));
      await this.messageRepo.save(messagesToUpdate);
    }

    return { status: "success" };
  }

  // 5. Utility: Get or Create Conversation between 2 users
  public async getOrCreateConversation(userId1: number, userId2: number) {
    let conversation = await this.conversationRepo.findOne({
      where: [
        { participant1: { id: userId1 }, participant2: { id: userId2 } },
        { participant1: { id: userId2 }, participant2: { id: userId1 } },
      ],
      relations: ["participant1", "participant2", "messages"],
    });

    if (!conversation) {
      const u1 = await this.userRepo.findOneBy({ id: userId1 });
      const u2 = await this.userRepo.findOneBy({ id: userId2 });

      if (!u1 || !u2) {
        throw new Error("Usuarios no encontrados");
      }

      conversation = this.conversationRepo.create({
        participant1: u1,
        participant2: u2,
      });

      await this.conversationRepo.save(conversation);
      // Reload para traer arrays de mensajes vacios y relaciones limpias
      conversation = (await this.conversationRepo.findOne({
        where: { id: conversation.id },
        relations: ["participant1", "participant2", "messages"],
      })) as Conversation;
    }

    return conversation;
  }

  // 6. Utility: Get the ID of the other participant in a chat
  public async getOtherUserOfChat(
    chatId: number,
    currentUserId: number
  ): Promise<number | null> {
    const conversation = await this.conversationRepo.findOne({
      where: { id: chatId },
      relations: ["participant1", "participant2"],
    });

    if (!conversation) return null;

    if (conversation.participant1.id === currentUserId) {
      return conversation.participant2.id;
    }
    return conversation.participant1.id;
  }
}
