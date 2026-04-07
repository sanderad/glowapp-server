import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Service } from "./service.entity";
import { PortfolioImage } from "./portfolio-image.entity";
import { Review } from "./review.entity";
import { Favorite } from "../../users/entities/favorite.entity";

export enum StylistCategory {
  NAILS = "Uñas",
  HAIR = "Cabello",
  BARBER = "Barbería",
  FACIAL = "Facial",
  MAKEUP = "Maquillaje",
  CORPORAL = "Corporal",
  OTHER = "Otro",
}

export enum ProfileTheme {
  PURPLE = "purple",
  BLUE = "blue",
  ORANGE = "orange",
  PINK = "pink",
  TEAL = "teal",
}

@Entity({ name: "stylist_profiles" })
export class StylistProfile {
  @PrimaryGeneratedColumn()
  id!: number;

  // Relación 1 a 1 con Usuario
  @OneToOne(() => User)
  @JoinColumn() // Esta columna guardará el user_id
  user!: User;

  @Column()
  businessName!: string;

  @Column({
    type: "enum",
    enum: StylistCategory,
    default: StylistCategory.NAILS,
  })
  category!: StylistCategory;

  @Column({ type: "text", nullable: true })
  bio!: string;

  @Column({ default: "Cali" })
  city!: string;

  @Column({ nullable: true })
  phone!: string;

  // --- SUSCRIPCIÓN ---
  @Column({ default: true })
  isVisible!: boolean; // Si no paga, esto pasa a false

  @Column({ type: "timestamp" })
  subscriptionEndsAt!: Date; // Fecha de corte

  // --- ESTADÍSTICAS ---
  @Column("float", { default: 0 })
  rating!: number;

  @Column({ default: 0 })
  reviewsCount!: number;

  @Column({ type: "int", default: 1 })
  yearsOfExperience!: number;

  @Column({
    type: "enum",
    enum: ProfileTheme,
    default: ProfileTheme.PURPLE,
  })
  colorTheme!: ProfileTheme;

  @Column({ type: "text", nullable: true })
  speciality!: string;

  // Relación 1 a N con Servicios
  @OneToMany(() => Service, (service) => service.stylist, { cascade: true })
  services!: Service[];

  @OneToMany(() => PortfolioImage, (image) => image.stylist, { cascade: true })
  portfolio!: PortfolioImage[];

  @OneToMany(() => Review, (review) => review.stylist, { cascade: true })
  reviews!: Review[];

  @OneToMany(() => Favorite, (favorite) => favorite.stylist, { cascade: true })
  favoritedBy!: Favorite[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
