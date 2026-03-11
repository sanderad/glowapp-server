import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { StylistProfile } from "./stylist-profile.entity";

@Entity({ name: "portfolio_images" })
export class PortfolioImage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  imageUrl!: string;

  // Relación Muchos a Uno: Muchas fotos pertenecen a Un Estilista
  @ManyToOne(() => StylistProfile, (stylist) => stylist.portfolio, {
    onDelete: "CASCADE",
  })
  stylist!: StylistProfile;
}
