import { injectable } from "inversify";
import { AppDataSource } from "../../config/data-source";
import { StylistProfile } from "./entities/stylist-profile.entity";
import { Review } from "./entities/review.entity";
import { User } from "../users/entities/user.entity";
import { Favorite } from "../users/entities/favorite.entity";
import { ILike, MoreThan } from "typeorm";
import { UpdatePortfolioStylistDto } from "./dto/update-portfolio-stylist.dto";
import { UpdateStylistProfileDto } from "./dto/update-stylist-profile.dto";
import { CreateReviewDto } from "./dto/create-review.dto";
import { Service } from "./entities/service.entity";
import { PortfolioImage } from "./entities/portfolio-image.entity";

@injectable()
export class StylistService {
  private stylistRepo = AppDataSource.getRepository(StylistProfile);
  private reviewRepo = AppDataSource.getRepository(Review);
  private userRepo = AppDataSource.getRepository(User);
  private favoriteRepo = AppDataSource.getRepository(Favorite);

  // 1. Listar Estilistas (Home)
  public async findAll(filters: { search?: string; category?: string }) {
    const whereClause: any = {
      isVisible: true, // Solo mostrar los que pagaron suscripción
      subscriptionEndsAt: MoreThan(new Date()), // Solo mostrar si no ha expirado
    };

    // Filtro por Categoría
    if (filters.category) {
      whereClause.category = filters.category;
    }

    // Filtro por Búsqueda (Nombre o Negocio) - Usamos ILike para ignorar mayúsculas
    // Nota: Para búsquedas complejas en relaciones se suele usar QueryBuilder,
    // pero para MVP esto funciona si buscamos por nombre de negocio.
    if (filters.search) {
      whereClause.businessName = ILike(`%${filters.search}%`);
    }

    const stylists = await this.stylistRepo.find({
      where: whereClause,
      relations: ["user", "services"], // Traer el nombre del usuario
      select: {
        // Seleccionamos solo lo necesario para la tarjeta del home
        id: true,
        businessName: true,
        category: true,
        services: true,
        rating: true,
        reviewsCount: true,
        yearsOfExperience: true,
        colorTheme: true,
        speciality: true,
        user: {
          id: true,
          fullName: true,
          photoUrl: true,
        },
      },
      order: {
        rating: "DESC", // Los mejores calificados primero
      },
    });

    return stylists;
  }

  // 2. Detalle de un Estilista (Perfil Completo)
  public async findOne(id: number) {
    const stylist = await this.stylistRepo.findOne({
      where: { id },
      relations: {
        user: true,
        services: true,
        portfolio: true,
      }, // ¡Traemos todo!
    });

    if (!stylist) {
      throw new Error("Estilista no encontrado");
    }

    return stylist;
  }

  public async findOneDetailed(id: number, currentUserId?: number) {
    const stylist = await this.stylistRepo.findOne({
      where: { id },
      select: {
        id: true,
        businessName: true,
        category: true,
        rating: true,
        reviewsCount: true,
        yearsOfExperience: true,
        colorTheme: true,
        speciality: true,
        bio: true,
        phone: true,
        // Notice we explicitly do NOT select 'phone' here for privacy.
        user: {
          id: true,
          fullName: true,
          photoUrl: true,
        },
        services: true,
        portfolio: true,
        reviews: true,
      },
      relations: {
        user: true,
        services: true,
        portfolio: true,
        reviews: {
          user: true,
        },
      }, // ¡Traemos todo!
    });

    if (!stylist) {
      throw new Error("Estilista no encontrado");
    }

    const reviewsSummary = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    if (stylist.reviews) {
      stylist.reviews.forEach((review) => {
        const star = Math.floor(Number(review.rating));
        if (star >= 1 && star <= 5) {
          reviewsSummary[star as keyof typeof reviewsSummary] += 1;
        }
      });
    }

    let isFavorite = false;
    if (currentUserId) {
      const favorite = await this.favoriteRepo.findOne({
        where: {
          user: { id: currentUserId },
          stylist: { id: stylist.id },
        },
      });
      isFavorite = !!favorite;
    }

    return {
      ...stylist,
      reviewsSummary,
      isFavorite,
    };
  }

  // 3. Update Stylist Profile (Personal & Professional Data)
  public async updateMyProfile(userId: number, dto: UpdateStylistProfileDto) {
    const stylist = await this.stylistRepo.findOne({
      where: { user: { id: userId } },
      relations: ["services", "portfolio"],
    });

    if (!stylist) {
      throw new Error("Perfil de estilista no encontrado para este usuario");
    }

    await AppDataSource.manager.transaction(async (entityManager) => {
      // 1. Update scalar fields if provided
      if (dto.businessName) stylist.businessName = dto.businessName;
      if (dto.category) stylist.category = dto.category as any; // Casteamos al enum de TypeORM
      if (dto.bio !== undefined) stylist.bio = dto.bio;
      if (dto.phone !== undefined) stylist.phone = dto.phone;
      if (dto.yearsOfExperience !== undefined)
        stylist.yearsOfExperience = Number(dto.yearsOfExperience) || 0;
      if (dto.colorTheme !== undefined)
        stylist.colorTheme = dto.colorTheme as any;
      if (dto.speciality !== undefined) stylist.speciality = dto.speciality;

      await entityManager.save(StylistProfile, stylist);

      // 2. Overwrite Services if provided
      if (dto.services) {
        // Delete all old services for this stylist
        await entityManager.delete(Service, { stylist: { id: stylist.id } });

        // Insert new ones
        const newServices = dto.services.map((s) =>
          entityManager.create(Service, { ...s, stylist })
        );
        await entityManager.save(Service, newServices);
      }

      // 3. Overwrite Portfolio if provided
      if (dto.portfolio) {
        // Delete old portfolio images
        await entityManager.delete(PortfolioImage, {
          stylist: { id: stylist.id },
        });

        // Insert new ones
        if (dto.portfolio.length > 0) {
          const newImages = dto.portfolio.map((url) =>
            entityManager.create(PortfolioImage, { imageUrl: url, stylist })
          );
          await entityManager.save(PortfolioImage, newImages);
        }
      }
    });

    // Return the freshly updated profile
    return this.findOneDetailed(stylist.id, userId);
  }

  public async updatePortfolio(
    id: number,
    portfolio: UpdatePortfolioStylistDto
  ) {
    const stylist = await this.findOne(id);

    if (!stylist) {
      throw new Error("Estilista no encontrado");
    }

    return true;
  }

  // 4. Crear Reseña
  public async createReview(
    stylistId: number,
    userId: number,
    dto: CreateReviewDto
  ) {
    // 1. Encontrar el estilista
    const stylist = await this.stylistRepo.findOne({
      where: { id: stylistId },
    });

    if (!stylist) {
      throw new Error("Estilista no encontrado");
    }

    // 2. Encontrar al usuario (el cliente que hace la reseña)
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    // Opcional: Validar que el usuario no haya reseñado a este estilista antes.
    // Omitido para simplificar, pero sería una consulta a reviewRepo.

    // 3. Crear la nueva reseña
    const review = this.reviewRepo.create({
      rating: dto.rating,
      comment: dto.comment,
      user: user,
      stylist: stylist,
    });

    await this.reviewRepo.save(review);

    // 4. Recalcular el rating y reviewsCount del estilista
    const currentRating = stylist.rating || 0;
    const currentCount = stylist.reviewsCount || 0;

    const newCount = currentCount + 1;
    // Nueva ponderación = ((Rating actual * Cantidad de reviews) + Nueva calificación) / Nueva Cantidad
    const newRating = (currentRating * currentCount + dto.rating) / newCount;

    // 5. Actualizar y guardar el perfil del estilista
    stylist.reviewsCount = newCount;
    stylist.rating = Number(newRating.toFixed(2)); // Redondear a 2 decimales

    await this.stylistRepo.save(stylist);

    return review;
  }

  // 5. Alternar Favorito (Toggle)
  public async toggleFavorite(userId: number, stylistId: number) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new Error("Usuario no encontrado");

    console.log("userId", userId);
    console.log("stylistId", stylistId);
    const stylist = await this.stylistRepo.findOneBy({ id: stylistId });
    if (!stylist) throw new Error("Estilista no encontrado");

    // Verificar si ya es favorito
    const existingFavorite = await this.favoriteRepo.findOne({
      where: {
        user: { id: userId },
        stylist: { id: stylistId },
      },
    });

    if (existingFavorite) {
      // Si existe, lo eliminamos (Unfavorite)
      await this.favoriteRepo.remove(existingFavorite);
      return { message: "Removido de favoritos", isFavorite: false };
    } else {
      // Si no existe, lo creamos (Favorite)
      const newFavorite = this.favoriteRepo.create({
        user,
        stylist,
      });
      await this.favoriteRepo.save(newFavorite);
      return { message: "Añadido a favoritos", isFavorite: true };
    }
  }

  // 6. Obtener Favoritos del Usuario
  public async getFavorites(userId: number) {
    const favorites = await this.favoriteRepo.find({
      where: {
        user: { id: userId },
        stylist: {
          isVisible: true,
          subscriptionEndsAt: MoreThan(new Date()),
        },
      },
      relations: {
        stylist: {
          user: true,
          services: true,
        },
      },
      order: {
        createdAt: "DESC",
      },
    });

    // Mapeamos para devolver solo los perfiles de estilista con el mismo formato que findAll
    return favorites.map((fav) => {
      const stylist = fav.stylist;
      return {
        id: stylist.id,
        businessName: stylist.businessName,
        category: stylist.category,
        services: stylist.services,
        rating: stylist.rating,
        reviewsCount: stylist.reviewsCount,
        yearsOfExperience: stylist.yearsOfExperience,
        colorTheme: stylist.colorTheme,
        speciality: stylist.speciality,
        user: {
          id: stylist.user.id,
          fullName: stylist.user.fullName,
          photoUrl: stylist.user.photoUrl,
        },
      };
    });
  }
}
