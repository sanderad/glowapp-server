import { injectable } from "inversify";
import { AppDataSource } from "../../config/data-source";
import { User, UserRole } from "../users/entities/user.entity";
import { StylistProfile } from "../stylists/entities/stylist-profile.entity";
import { Service } from "../stylists/entities/service.entity";
import { PortfolioImage } from "../stylists/entities/portfolio-image.entity";
import { Favorite } from "../users/entities/favorite.entity";
import { Review } from "../stylists/entities/review.entity";
import { RegisterClientDto } from "./dto/register-client.dto";
import { RegisterStylistDto } from "./dto/register-stylist.dto";
import { LoginDto } from "./dto/login.dto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

@injectable()
export class AuthService {
  private userRepo = AppDataSource.getRepository(User);

  public async registerClient(
    dto: RegisterClientDto
  ): Promise<{ token: string; user: any }> {
    // 1. Verificar si ya existe
    const existingUser = await this.userRepo.findOneBy({ email: dto.email });
    if (existingUser) {
      throw new Error("El correo ya está registrado");
    }

    // 2. Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    // 3. Crear Usuario
    const newUser = this.userRepo.create({
      fullName: dto.fullName,
      email: dto.email,
      password: hashedPassword,
      photoUrl: dto.photoUrl,
      role: UserRole.CLIENT, // Forzamos rol de Cliente
    });

    await this.userRepo.save(newUser);

    // 4. Generar Token JWT
    const token = this.generateToken(newUser);

    // 5. Retornar (Sin la contraseña)
    return {
      token,
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
      },
    };
  }

  public async registerStylist(
    dto: RegisterStylistDto
  ): Promise<{ token: string; user: any }> {
    // 1. Validar correo duplicado antes de iniciar transacción
    const existingUser = await this.userRepo.findOneBy({ email: dto.email });
    if (existingUser) throw new Error("El correo ya está registrado");

    // INICIO TRANSACCIÓN
    const result = await AppDataSource.manager.transaction(
      async (entityManager) => {
        // A. Crear Usuario
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(dto.password, salt);

        const newUser = entityManager.create(User, {
          fullName: dto.fullName,
          email: dto.email,
          password: hashedPassword,
          photoUrl: dto.photoUrl,
          role: UserRole.STYLIST, // Rol Estilista
        });
        const savedUser = await entityManager.save(newUser);

        // B. Calcular fecha de vencimiento (30 días gratis)
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30);

        // C. Crear Perfil de Estilista
        const newProfile = entityManager.create(StylistProfile, {
          user: savedUser,
          businessName: dto.businessName,
          category: dto.category,
          bio: dto.bio,
          phone: dto.phone,
          subscriptionEndsAt: expirationDate,
          isVisible: true,
          rating: 5.0, // Empiezan con 5 estrellas por defecto para motivar

          yearsOfExperience: dto.yearsOfExperience,
          colorTheme: dto.colorTheme,

          speciality: dto.speciality,
        });
        const savedProfile = await entityManager.save(newProfile);

        // D. Crear Servicios
        // Mapeamos los DTOs a Entidades
        const servicesToSave = dto.services.map((s) =>
          entityManager.create(Service, {
            name: s.name,
            price: s.price,
            duration: s.duration,
            stylist: savedProfile,
          })
        );
        await entityManager.save(servicesToSave);

        // Verificamos si vienen fotos en el array portfolio
        if (dto.portfolio && dto.portfolio.length > 0) {
          const imagesToSave = dto.portfolio.map((url) =>
            entityManager.create(PortfolioImage, {
              imageUrl: url,
              stylist: savedProfile, // Conectamos con el perfil recién creado
            })
          );

          await entityManager.save(imagesToSave);
        }

        return { user: savedUser, stylistId: savedProfile.id };
      }
    );
    // FIN TRANSACCIÓN

    // 2. Generar Token
    const token = this.generateToken(result.user, result.stylistId);

    return {
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        businessName: dto.businessName, // Devolvemos info útil
        stylistId: result.stylistId,
      },
    };
  }

  public async getMe(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ["id", "fullName", "email", "role", "photoUrl", "createdAt"],
    });

    if (!user) throw new Error("Usuario no encontrado");

    let stylistId: number | undefined;
    let phone: string | undefined;
    let accountExpired: boolean | undefined;

    if (user.role === UserRole.STYLIST) {
      const profile = await AppDataSource.manager.findOne(StylistProfile, {
        where: { user: { id: userId } },
        select: ["id", "phone", "subscriptionEndsAt"],
      });
      if (profile) {
        stylistId = profile.id;
        phone = profile.phone;
        accountExpired = profile.subscriptionEndsAt < new Date();
      }
    }

    return {
      ...user,
      stylistId,
      phone,
      accountExpired,
    };
  }

  public async login(dto: LoginDto): Promise<{ token: string; user: any }> {
    // 1. Buscar usuario (Explicitamente seleccionamos el password para compararlo)
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      select: ["id", "email", "password", "fullName", "role"],
    });

    // 2. Validar si existe
    if (!user) {
      throw new Error("Credenciales inválidas");
    }

    // 3. Comparar contraseñas
    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new Error("Credenciales inválidas");
    }

    let stylistId: number | undefined;
    let phone: string | undefined;
    let accountExpired: boolean | undefined;

    if (user.role === UserRole.STYLIST) {
      const profile = await AppDataSource.manager.findOne(StylistProfile, {
        where: { user: { id: user.id } },
        select: ["id", "phone", "subscriptionEndsAt"],
      });
      if (profile) {
        stylistId = profile.id;
        phone = profile.phone;
        accountExpired = profile.subscriptionEndsAt < new Date();
      }
    }

    // 4. Generar Token
    const token = this.generateToken(user, stylistId);

    // 5. Retornar
    return {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        photoUrl: user.photoUrl,
        stylistId,
        phone,
        accountExpired,
      },
    };
  }

  public async deleteUser(userId: number): Promise<void> {
    const user = await this.userRepo.findOneBy({ id: userId });

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    await AppDataSource.manager.transaction(async (entityManager) => {
      // 1. Obtener el perfil de estilista del usuario si existe
      const stylistProfile = await entityManager.findOne(StylistProfile, {
        where: { user: { id: userId } },
      });

      // 2. Eliminar referencias donde EL USUARIO sea el autor
      await entityManager.delete(Favorite, { user: { id: userId } });
      await entityManager.delete(Review, { user: { id: userId } });

      // 3. Si el usuario es ESTILISTA, eliminar sus referencias primero
      if (stylistProfile) {
        // Eliminar donde el estilista sea el "recibidor"
        await entityManager.delete(Favorite, {
          stylist: { id: stylistProfile.id },
        });
        await entityManager.delete(Review, {
          stylist: { id: stylistProfile.id },
        });

        // Eliminar dependencias propias
        await entityManager.delete(Service, {
          stylist: { id: stylistProfile.id },
        });
        await entityManager.delete(PortfolioImage, {
          stylist: { id: stylistProfile.id },
        });

        // Eliminar perfil
        await entityManager.remove(StylistProfile, stylistProfile);
      }

      // 4. Finalmente, eliminar el usuario
      await entityManager.remove(User, user);
    });
  }

  private generateToken(user: User, stylistId?: number): string {
    return jwt.sign(
      { id: user.id, role: user.role, stylistId },
      process.env.JWT_SECRET || "secret",
      { expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as any }
    );
  }
}
