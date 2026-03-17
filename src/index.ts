import "reflect-metadata";
import * as express from "express";
import { InversifyExpressServer } from "inversify-express-utils";
import { AppDataSource } from "./config/data-source";
import { container } from "./shared/container/inversify.config";
import { env } from "./config/env";
import path from "path";
import * as cors from "cors";
import cookieParser from "cookie-parser";
import { Server as SocketIOServer } from "socket.io";
import { ChatGateway } from "./modules/chat/chat.gateway";
import { TYPES } from "./shared/container/types";
import { ChatService } from "./modules/chat/chat.service";

// Initialize TypeORM Data Source
AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");

    // Start Inversify Express Server
    const server = new InversifyExpressServer(container);

    server.setConfig((app: express.Application) => {
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));
      // Add CORS or other middlewares here
      app.use(
        cors.default({
          origin: [
            "http://localhost:5173",
            "https://pension-marks-progress-composer.trycloudflare.com",
          ],
          credentials: true,
        })
      );

      app.get("/health", (req: express.Request, res: express.Response) =>
        res.status(200).send("Backend Vivo! 🚀")
      );

      app.use(cookieParser());
    });

    server.setErrorConfig((app: express.Application) => {
      app.use(
        (
          err: any,
          req: express.Request,
          res: express.Response,
          next: express.NextFunction
        ) => {
          console.error("🔥 ERROR REAL DEL BACKEND:");
          console.dir(err, { depth: null }); // Imprime el objeto completo sin ocultar nada
          res.status(500).json({
            error: err.message || "Error interno",
            details: err,
          });
        }
      );
    });

    const app = server.build();

    const httpServer = app.listen(env.port, () => {
      console.log(`Server is running at http://localhost:${env.port}`);
    });

    // Initialize Socket.io
    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: [
          "http://localhost:5173",
          "https://pension-marks-progress-composer.trycloudflare.com",
        ],
        credentials: true,
      },
    });

    // Get ChatService from Inversify Container and initialize WebSockets
    const chatService = container.get<ChatService>(TYPES.ChatService);
    const chatGateway = new ChatGateway(io, chatService);
    chatGateway.initialize();
  })
  .catch((err: any) => {
    console.error("Error during Data Source initialization:", err);
  });
