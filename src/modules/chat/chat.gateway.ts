import { Server, Socket } from "socket.io";
import { ChatService } from "./chat.service";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";

export class ChatGateway {
  // Manejo de estado en memoria: mapea userId -> SocketId
  private connectedUsers = new Map<number, string>();

  constructor(private io: Server, private chatService: ChatService) {}

  public initialize() {
    console.log("Chat Gateway Initializing...");

    // Middleware de Autenticación
    this.io.use((socket, next) => {
      // Intentar obtener de auth payload (frontend suele enviar socket.auth = { token })
      // o revisar las cookies
      const token =
        socket.handshake.auth?.token ||
        this.extractTokenFromCookie(socket.handshake.headers.cookie);

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      jwt.verify(token, env.jwtSecret || "secret", (err: any, decoded: any) => {
        if (err) return next(new Error("Authentication error: Invalid token"));
        socket.data.user = decoded; // { id, role }
        next();
      });
    });

    this.io.on("connection", (socket: Socket) => {
      const userId = socket.data.user.id;

      // 1. AÑADE ESTO - Subscribir al usuario a una sala de alertas eterna
      socket.join(`user_${userId}`);

      this.connectedUsers.set(userId, socket.id);

      console.log(`User connected: ${userId} (${socket.id})`);

      // Emitir estado en línea a todos
      this.io.emit("user_status", {
        userId,
        isOnline: true,
        lastSeen: new Date(),
      });

      // 2. Transmitir AL NUEVO SOCKET todos los usuarios que YA estaban conectados
      this.connectedUsers.forEach((socketId, connectedUserId) => {
        // No nos avisamos a nosotros mismos de nuevo
        if (connectedUserId !== userId) {
          socket.emit("user_status", {
            userId: connectedUserId,
            isOnline: true,
            lastSeen: new Date(),
          });
        }
      });

      // ---- EVENTOS DE CHAT ----

      // 1. Unirse a un chat específico (crear / usar Room)
      socket.on("join_chat", ({ chatId }) => {
        const roomName = `chat_${chatId}`;
        socket.join(roomName);
        console.log(`User ${userId} joined room ${roomName}`);
      });

      // 2. Enviar un mensaje
      socket.on(
        "send_message",
        async (payload: {
          chatId: number;
          text?: string;
          imageUrl?: string;
        }) => {
          try {
            const { chatId, text, imageUrl } = payload;
            // Guardar en la DB a través del service
            const message = await this.chatService.createMessage(
              chatId,
              userId,
              text,
              imageUrl
            );

            // Averigua de la BD el ID del receptor de este chat
            const recipientId = await this.chatService.getOtherUserOfChat(
              chatId,
              userId
            );

            // Emitir al creador y al receptor que tengan activa la pantalla del cuarto
            this.io
              .to(`chat_${chatId}`)
              .emit("receive_message", { ...message, chatId });

            // Y finalmente emite la "Alerta Global" de forma cruzada a la sala eterna de la OTRA persona
            if (recipientId) {
              this.io
                .to(`user_${recipientId}`)
                .emit("receive_message", { ...message, chatId });
            }
          } catch (error) {
            console.error("Error sending message:", error);
            socket.emit("error", { message: "Error enviando el mensaje" });
          }
        }
      );

      // 3. Marcar como leído
      socket.on("mark_as_read", async ({ chatId }) => {
        try {
          await this.chatService.markAsRead(chatId, userId);
          // Notificar al otro usuario que sus mensajes han sido leídos
          this.io
            .to(`chat_${chatId}`)
            .emit("message_read", { chatId, readBy: userId });
        } catch (error) {
          console.error("Error marking as read", error);
        }
      });

      // 4. Escribiendo... (Typing indicator)
      socket.on("typing", ({ chatId, isTyping }) => {
        // Enviar al cuarto, excepto a quien lo originó
        socket.to(`chat_${chatId}`).emit("typing", {
          chatId,
          userId, // quién está escribiendo
          isTyping,
        });
      });

      // ---- DESCONEXIÓN ----
      socket.on("disconnect", () => {
        console.log(`User disconnected: ${userId} (${socket.id})`);
        this.connectedUsers.delete(userId);

        // Broadcast desconexión
        this.io.emit("user_status", {
          userId,
          isOnline: false,
          lastSeen: new Date(),
        });
      });
    });
  }

  // Utilidad para extraer cookie manualmente del handshake
  private extractTokenFromCookie(cookieHeader?: string): string | null {
    if (!cookieHeader) return null;
    const cookies = cookieHeader
      .split(";")
      .reduce((acc: Record<string, string>, cookie) => {
        const [key, value] = cookie.trim().split("=");
        acc[key] = value;
        return acc;
      }, {});
    return cookies["token"] || null;
  }
}
