import { Request, Response } from "express";
import { controller, httpPost } from "inversify-express-utils";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { env } from "../../config/env";

console.log("Credenciales Cloudinary:", {
  cloud: process.env.CLOUDINARY_CLOUD_NAME,
  key: process.env.CLOUDINARY_API_KEY,
  secret: process.env.CLOUDINARY_API_SECRET ? "SI_HAY_SECRET" : "NO_HAY_SECRET",
});

// 1. Configurar Cloudinary con tus credenciales
cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Configurar el Storage para que Multer envíe el archivo a Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "glowapp_uploads",
    // Solo permitimos estos formatos seguros.
    // ¡IMPORTANTE: No ponemos format ni public_id custom para evitar el error 400!
    allowed_formats: [
      "jpg",
      "jpeg",
      "png",
      "webp",
      "mp4",
      "mov",
      "avi",
      "avif",
    ],
  } as any,
});
const upload = multer({ storage });

@controller("/uploads")
export class UploadController {
  @httpPost("/single", upload.single("file"))
  public async uploadSingle(req: Request, res: Response) {
    if (!req.file) {
      return res.status(400).json({ error: "No se subió ningún archivo" });
    }

    // ¡Magia! req.file.path ahora contiene la URL pública directa de Cloudinary
    return res.json({ url: req.file.path });
  }

  @httpPost("/multiple", upload.array("files", 5))
  public async uploadMultiple(req: Request, res: Response) {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ error: "No se subieron archivos" });
    }

    const files = req.files as Express.Multer.File[];
    // Mapeamos para obtener la URL de cada archivo subido
    const urls = files.map((file) => file.path);

    return res.json({ urls });
  }
}
